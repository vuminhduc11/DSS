import React, { useEffect, useState } from 'react';
import { Lightbulb, Target, Users, DollarSign, ArrowRight, Zap } from 'lucide-react';
import { getStrategy, getLatestRun } from '../services/api';

const StrategyPage = () => {
    const [strategies, setStrategies] = useState([]);
    const [runInfo, setRunInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const run = await getLatestRun();
                setRunInfo(run);
                const strategiesData = await getStrategy(run.id);
                setStrategies(strategiesData);
            } catch (err) {
                setError("Could not load strategies. Ensure you have run clustering at least once.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center shadow-sm">
            <div className="p-2 bg-red-100 rounded-full mr-4">
                <Lightbulb className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-lg">Action Required</h3>
                <p>{error}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2 flex items-center">
                        <Target className="w-8 h-8 mr-3" />
                        Strategic Recommendations
                    </h2>
                    <p className="text-blue-100 text-lg max-w-2xl">
                        AI-generated insights based on your latest clustering run: <span className="font-semibold text-white bg-white/20 px-2 py-1 rounded-lg ml-1">{runInfo?.name}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {strategies.map((strat, index) => (
                    <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                        <div className="p-6 border-b border-gray-50">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{strat.segment_name}</h3>
                                    <p className="text-sm text-gray-500 font-medium">Cluster {strat.cluster}</p>
                                </div>
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                    {strat.customer_count} Customers
                                </span>
                            </div>

                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                                <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                                    <DollarSign className="w-4 h-4 mr-1.5 text-green-600" />
                                    <span className="font-semibold">${strat.avg_spend.toFixed(2)}</span>
                                    <span className="text-gray-400 ml-1">avg. spend</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gradient-to-b from-white to-gray-50/50">
                            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center uppercase tracking-wide">
                                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                                Recommended Action
                            </h4>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                {strat.strategy}
                            </p>

                            <button className="text-blue-600 font-semibold text-sm flex items-center hover:text-blue-700 transition-colors">
                                View Segment Details <ArrowRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StrategyPage;
