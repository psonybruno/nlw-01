import { Request, Response } from 'express';
import knex from '../database/connection';

export default class PointsController
{
    async index(request: Request, response: Response)
    {
        const {city, uf, items} = request.query;
        const parsedItems = String(items).split(',').map(item => Number(item.trim()));

        const points = await knex('points')
                                .join('point_items', 'point_id', '=', 'point_items.point_id')
                                .whereIn('point_items.item_id', parsedItems)
                                .where('city', String(city))
                                .where('uf', String(uf))
                                .distinct()
                                .select('points.*');

        const serializedPoints = points.map((point) => {
          return {
            ...point,
            image_url: `http://192.168.0.8:3033/uploads/${point.image}`,
          };
        });

        return response.json(points);

    }

    async show(request: Request, response: Response)
    {
        const {id} = request.params;

        const point = await knex('points').where('id', id).first();
        if(!point)
            return response.status(400).json({message: 'Point not found'});

        const items = await knex('Items').join('point_items', 'items_id', '=', 'point_items.item_id').where('point_items.point_id', id);

        return response.json({point, items});
    }

    async create(request: Request, response: Response)
    {
        try {
            const {
              name,
              email,
              whatsapp,
              latitude,
              longitude,
              city,
              uf,
              items,
            } = request.body;

            const point = {
              image: request.file.filename,
              name,
              email,
              whatsapp,
              latitude,
              longitude,
              city,
              uf,
            };

            const trx = await knex.transaction();

            const insertedIds = await trx("points").insert(point);

            const point_id = insertedIds[0];

            const pointItems = items
              .split(',')
              .map((item: string) => Number(item.trim()))
              .map((item_id: number) => {
              return {
                item_id,
                point_id: point_id,
              };
            });

            await trx("points_items").insert(pointItems);

            await trx.commit();

            return response.status(200).json({ id: point_id, ...point });

        } catch (error) {
            return response.status(400).send();
        }
    }
}