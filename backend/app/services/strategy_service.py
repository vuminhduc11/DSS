from sqlalchemy.orm import Session
from app.models.models import ClusterResult, CustomerCluster, Customer, Transaction
from sqlalchemy import func
import pandas as pd

# Pre-defined strategy templates based on customer segmentation best practices
STRATEGY_TEMPLATES = {
    "vip": {
        "segment_name": "VIP / Champions",
        "strategies": [
            "Cung cấp chương trình khách hàng thân thiết VIP với ưu đãi độc quyền",
            "Gửi thư cảm ơn cá nhân hóa và quà tặng sinh nhật",
            "Mời tham gia sự kiện ra mắt sản phẩm mới trước công chúng",
            "Chỉ định nhân viên chăm sóc riêng (Account Manager)"
        ],
        "email_template": "Kính gửi [Tên KH], cảm ơn Quý khách đã luôn đồng hành cùng chúng tôi. Với tư cách khách hàng VIP, Quý khách được hưởng [ưu đãi]...",
        "priority": "high"
    },
    "loyal": {
        "segment_name": "Loyal Customers",
        "strategies": [
            "Đề xuất sản phẩm bổ sung (cross-sell) dựa trên lịch sử mua hàng",
            "Gửi email giới thiệu sản phẩm cao cấp hơn (upsell)",
            "Tặng điểm thưởng khi giới thiệu bạn bè",
            "Cung cấp voucher giảm giá cho lần mua tiếp theo"
        ],
        "email_template": "Chào [Tên KH], chúng tôi có một số sản phẩm phù hợp với sở thích của bạn...",
        "priority": "medium-high"
    },
    "regular": {
        "segment_name": "Regular Customers",
        "strategies": [
            "Gửi newsletter định kỳ với nội dung hữu ích",
            "Cung cấp mã giảm giá nhỏ để khuyến khích mua hàng thường xuyên",
            "Nhắc nhở về giỏ hàng bị bỏ quên",
            "Giới thiệu chương trình tích điểm"
        ],
        "email_template": "Xin chào [Tên KH], đừng bỏ lỡ ưu đãi đặc biệt tuần này...",
        "priority": "medium"
    },
    "at_risk": {
        "segment_name": "At Risk / Hibernating",
        "strategies": [
            "Gửi email 'Chúng tôi nhớ bạn' với ưu đãi đặc biệt",
            "Khảo sát lý do khách hàng không quay lại",
            "Cung cấp voucher giảm giá hấp dẫn để kích hoạt lại",
            "Gọi điện chăm sóc trực tiếp nếu giá trị cao"
        ],
        "email_template": "Chào [Tên KH], đã lâu chúng tôi không gặp bạn. Đây là ưu đãi đặc biệt dành riêng cho bạn...",
        "priority": "high"
    },
    "new": {
        "segment_name": "New Customers",
        "strategies": [
            "Gửi email chào mừng với hướng dẫn sử dụng sản phẩm",
            "Cung cấp ưu đãi cho lần mua thứ 2",
            "Hỏi feedback sau lần mua đầu tiên",
            "Giới thiệu các sản phẩm phổ biến khác"
        ],
        "email_template": "Chào mừng [Tên KH] đến với gia đình chúng tôi! Đây là những gì bạn cần biết...",
        "priority": "medium"
    },
    "low_value": {
        "segment_name": "Low Value / Occasional",
        "strategies": [
            "Gửi email khuyến mãi theo mùa",
            "Giới thiệu sản phẩm giá rẻ phổ biến",
            "Cung cấp free shipping cho đơn hàng lớn hơn",
            "Tập trung vào marketing automation thay vì chăm sóc cá nhân"
        ],
        "email_template": "Xin chào, đừng bỏ lỡ đợt khuyến mãi lớn nhất năm...",
        "priority": "low"
    }
}

def classify_segment(avg_spend: float, frequency: float, recency_days: float = None) -> str:
    """Classify customer segment based on RFM metrics"""
    if avg_spend > 1000 and frequency > 10:
        return "vip"
    elif avg_spend > 500 or frequency > 5:
        return "loyal"
    elif avg_spend > 100:
        return "regular"
    elif avg_spend < 50 and frequency <= 2:
        return "low_value"
    else:
        return "at_risk"

def generate_strategies(run_id: int, db: Session):
    """Generate detailed strategies for each cluster using DYNAMIC RELATIVE thresholds"""
    
    # 1. Fetch Cluster Statistics
    query = db.query(
        CustomerCluster.cluster_label,
        func.avg(Transaction.amount).label('avg_spend'),
        func.count(Transaction.id).label('transaction_count'),
        func.count(func.distinct(Customer.id)).label('customer_count')
    ).join(Customer, CustomerCluster.customer_id == Customer.id)\
     .join(Transaction, Transaction.customer_id == Customer.id)\
     .filter(CustomerCluster.cluster_result_id == run_id)\
     .group_by(CustomerCluster.cluster_label)
     
    stats = query.all()
    
    if not stats:
        return []

    # 2. Calculate Global Percentiles for Relative Grading
    # We need benchmarks to know what "High" spend means for THIS dataset
    all_clusters_data = []
    for s in stats:
        all_clusters_data.append({
            "label": s.cluster_label,
            "avg_spend": float(s.avg_spend or 0),
            "frequency": float(s.transaction_count or 0) / float(s.customer_count or 1)
        })
    
    df_clusters = pd.DataFrame(all_clusters_data)
    
    # Calculate thresholds (simple quantiles across the clusters)
    # Ideally we'd use customer-level quantiles, but cluster-level averages are a decent proxy for "Cluster Type"
    
    monetary_75 = df_clusters['avg_spend'].quantile(0.75) if not df_clusters.empty else 100
    monetary_25 = df_clusters['avg_spend'].quantile(0.25) if not df_clusters.empty else 20
    
    freq_75 = df_clusters['frequency'].quantile(0.75) if not df_clusters.empty else 5
    freq_25 = df_clusters['frequency'].quantile(0.25) if not df_clusters.empty else 1

    strategies = []
    
    for stat in stats:
        label = stat.cluster_label
        avg_spend = float(stat.avg_spend or 0)
        customer_count = stat.customer_count
        tx_count = stat.transaction_count
        
        # Calculate frequency
        frequency = tx_count / customer_count if customer_count > 0 else 0
        
        # --- DYNAMIC CLASSIFICATION LOGIC ---
        # Compare THIS cluster's average against the Global benchmarks
        
        # Logic Tree:
        # 1. High Value (Top 25% Spend)
        if avg_spend >= monetary_75:
            if frequency >= freq_75:
                segment_key = "vip" # Spends a lot, buys often
            else:
                segment_key = "at_risk" # Spends a lot, but low freq (or verify recency if available) - treating as "Big Spenders / Whales"
        
        # 2. Medium Value (Middle 50%)
        elif avg_spend >= monetary_25:
            if frequency >= freq_75:
                segment_key = "loyal" # Medium spend, but high frequency
            elif frequency >= freq_25:
                segment_key = "regular" # Average spend, average freq
            else:
                segment_key = "new" # Middle spend, low freq (likely new)
                
        # 3. Low Value (Bottom 25%)
        else:
            if frequency >= freq_75:
                segment_key = "loyal" # Low spend, but VERY frequent (Bargain hunters)
            else:
                segment_key = "low_value" # Low spend, low freq

        template = STRATEGY_TEMPLATES.get(segment_key, STRATEGY_TEMPLATES["regular"])
        
        strategies.append({
            "cluster": label,
            "segment_name": template["segment_name"],
            "segment_key": segment_key,
            "avg_spend": avg_spend,
            "frequency": round(frequency, 2),
            "customer_count": customer_count,
            "transaction_count": tx_count,
            "priority": template["priority"],
            "strategies": template["strategies"],
            "email_template": template["email_template"],
            "explanation": f"Spend: ${avg_spend:.0f} (Benchmark: >${monetary_75:.0f}), Freq: {frequency:.1f} (Benchmark: >{freq_75:.1f})",
            "strategy": template["strategies"][0] if template["strategies"] else ""
        })
    
    # Sort by priority
    priority_order = {"high": 0, "medium-high": 1, "medium": 2, "low": 3}
    strategies.sort(key=lambda x: priority_order.get(x["priority"], 99))
        
    return strategies
