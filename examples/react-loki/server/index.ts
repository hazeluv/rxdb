import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import Nano from 'nano';

const nano = Nano('http://localhost:10102');

const app: Express = express();
const port = 10102;

app.use(cors());

app.get('/', async (req: Request, res: Response) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    try {
        await nano.db.create('heroes');
        nano.use('heroes');
        // succeeded
        // console.log(response);
    } catch (e) {
        // failed
        console.error(e);
    }
    res.send('Express + TypeScript Server');
});

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
