const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function main() {
    try {
        await client.connect();

        const database = client.db('mydatabase');
        const collection = database.collection('animated_tv_series');

        await collection.createIndex({ Title: 1 });

        const explainResult = await collection.find({ Title: "Пример шоу" }).explain("executionStats");
        console.log("Результат explain:", explainResult);


        const aggregationResult = await collection.aggregate([
            {
                $match: {
                    Year: 2020
                }
            },
            {
                $group: {
                    _id: "$Year",
                    averageGoogleUserRating: { $avg: "$Google users" }
                }
            }
        ]).toArray();
        console.log("Результат агрегации:", aggregationResult);

        // Аналогично, убедитесь в правильности названий полей при выполнении запроса find
        console.time('findQuery');
        const shows = await collection.find({Year: 2020}, { projection: { _id: 0, Title: 1, "Google users": 1 } }).toArray();
        const averageGoogleUserRating = shows.reduce((acc, cur) => acc + parseInt(cur["Google users"]), 0) / shows.length;
        console.timeEnd('findQuery');
        console.log('Средний рейтинг пользователей Google (findQuery):', averageGoogleUserRating);

        console.time('aggregateQuery');
        const result = await collection.aggregate([
            {
                $group: {
                    _id: "$Year",
                    averageGoogleUserRating: {
                        $avg: {
                            $cond: {
                                if: { $ne: ["$Google users", ""] },
                                then: { $toDouble: { $trim: { input: "$Google users", chars: " %" } } },
                                else: null
                            }
                        }
                    }
                }
            }
        ]).toArray();
        console.timeEnd('aggregateQuery');
        console.log('Средний рейтинг пользователей Google (aggregateQuery):', result[0]?.averageGoogleUserRating);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
