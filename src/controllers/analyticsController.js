const Order = require('../models/Order');

const parseRange = (range) => {
    const ranges = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
    };

    const days = ranges[range];
    if (!days) {
        const err = new Error(`Unsupported range "${range}". Supported values: ${Object.keys(ranges).join(', ')}`);
        err.status = 400;
        throw err;
    }

    const from = new Date();
    from.setUTCDate(from.getUTCDate() - days);
    from.setUTCHours(0, 0, 0, 0); // normalise to midnight UTC
    return from;
};

const getSalesSummary = async (req, res, next) => {
    try {
        const range = req.query.range || '7d';
        const fromDate = parseRange(range);

        const matchStage = { $match: { createdAt: { $gte: fromDate } } };
        const facetStage = {
            $facet: {

                dailySales: [
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' },
                            },
                            revenue: { $sum: '$totalAmount' },
                            orderCount: { $sum: 1 },
                        },
                    },
                    { $sort: { _id: 1 } },
                    {
                        $project: {
                            _id: 0,
                            date: '$_id',
                            revenue: 1,
                            orderCount: 1,
                        },
                    },
                ],

                //Top 5 products 

                topProducts: [
                    { $unwind: '$items' },
                    {
                        $group: {
                            _id: '$items.productName',
                            quantitySold: { $sum: '$items.qty' },
                        },
                    },
                    { $sort: { quantitySold: -1 } }, // highest volume first
                    { $limit: 5 },
                    {
                        $project: {
                            _id: 0,
                            productName: '$_id',
                            quantitySold: 1,
                        },
                    },
                ],

                // Average order value
                averageOrderValue: [
                    {
                        $group: {
                            _id: null,
                            avg: { $avg: '$totalAmount' },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            averageOrderValue: { $ifNull: ['$avg', 0] },
                        },
                    },
                ],

                //Orders by status 
                ordersByStatus: [
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { _id: 1 } }, // alphabetical: delivered, pending, processing, shipped
                    {
                        $project: {
                            _id: 0,
                            status: '$_id',
                            count: 1,
                        },
                    },
                ],
            },
        };

        const [result] = await Order.aggregate([matchStage, facetStage]);

        const {
            dailySales,
            topProducts,
            averageOrderValue: avgArr,
            ordersByStatus,
        } = result;

        return res.status(200).json({
            success: true,
            data: {
                range,
                from: fromDate.toISOString().split('T')[0],
                dailySales,
                topProducts,
                averageOrderValue: avgArr.length ? avgArr[0].averageOrderValue : 0,
                ordersByStatus,
            },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getSalesSummary };
