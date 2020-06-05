import {Request, Response} from 'express';
import knex from '../database/connection';

export default class ItemsController {
    async index(request: Request, response: Response)
    {
      try {
        const items = await knex("items").select("*");

        const serializedItems = items.map((item) => {
          return {
            id: item.id,
            title: item.title,
            image_url: `http://192.168.0.8:3033/uploads/${item.image}`,
          };
        });

        return response.json(serializedItems);
      } catch (error) {
        return response.status(404).send("Error")
      }

    }
}