import BaseModel from './BaseModel.js';

class Event extends BaseModel {
    static get tableName() {
        return 'events';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            required: ['name', 'date', 'price', 'organizer', 'address', 'imageurl'],
            properties: {
                id: { type: 'integer' },
                username: { type: 'string', minLength: 1 },
                date: { type: 'string' },
                price: { type: 'number' },
                description: { type: 'string' },
                organizer: { type: 'string', minLength: 1 },
                address: { type: 'string', minLength: 1 },
                imageurl: { type: 'string' },
                number_of_going: { type: 'string' },
            },
        };
    }
}

export default Event;
