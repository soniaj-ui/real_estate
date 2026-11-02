import { z, type ZodType } from 'zod';
import { loginSchema, registerSchema } from '../modules/auth/auth.schema';
import { createInquirySchema } from '../modules/inquiries/inquiry.schema';
import {
  createPropertySchema,
  PROPERTY_TYPES,
  SORT_OPTIONS,
  updatePropertySchema,
} from '../modules/properties/property.schema';

// Request bodies come from the zod schemas, so the docs and the validation can't disagree.
const jsonSchema = (schema: ZodType) => {
  const { $schema: _dialect, ...rest } = z.toJSONSchema(schema, { io: 'input' }) as Record<string, unknown>;
  return rest;
};

const jsonBody = (schema: ZodType) => ({
  required: true,
  content: { 'application/json': { schema: jsonSchema(schema) } },
});

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const response = (description: string, schema?: object) =>
  schema ? { description, content: { 'application/json': { schema } } } : { description };

const error = (description: string) => response(description, ref('Error'));

const secured = [{ bearerAuth: [] }];

const pathParam = (name: string, description: string) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string' },
});

const queryParam = (name: string, description: string, schema: object = { type: 'string' }) => ({
  name,
  in: 'query',
  required: false,
  description,
  schema,
});

const pageParams = [
  queryParam('limit', 'Items per page, 1 to 50.', { type: 'integer', minimum: 1, maximum: 50, default: 20 }),
  queryParam('cursor', 'The `nextCursor` value from the previous page.'),
];

const page = (itemName: string) => ({
  type: 'object',
  required: ['items', 'nextCursor'],
  properties: {
    items: { type: 'array', items: ref(itemName) },
    nextCursor: { type: ['string', 'null'], description: 'Pass as `cursor` for the next page. Null on the last page.' },
  },
});

const propertyFields = {
  id: { type: 'string', example: '101' },
  slug: { type: 'string', example: '2-bhk-near-baner-road-3f9a1c2e' },
  title: { type: 'string', example: '2 BHK near Baner road' },
  city: { type: 'string', example: 'pune' },
  locality: { type: 'string', example: 'Baner' },
  type: { type: 'string', enum: [...PROPERTY_TYPES] },
  price: { type: 'integer', example: 7500000 },
  bedrooms: { type: 'integer', example: 2 },
  created_at: { type: 'string', format: 'date-time' },
};

const rateLimited = error('Too many requests');

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Real Estate Listing API',
    version: '1.0.0',
    description:
      'Listings, search, similar properties and inquiries. Log in or register to get an access token, then choose **Authorize** and paste it. Refresh tokens travel in an httpOnly cookie.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Auth', description: 'Accounts and tokens' },
    { name: 'Properties', description: 'Listings, search and similar properties' },
    { name: 'Images', description: 'Listing images' },
    { name: 'Inquiries', description: 'Contacting property owners' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string', example: 'Property not found' },
          details: { type: 'array', items: { type: 'object' }, description: 'Field problems, on validation errors.' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6' },
          name: { type: 'string', example: 'Asha' },
          email: { type: 'string', format: 'email', example: 'asha@example.com' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: { user: ref('User'), accessToken: { type: 'string', description: 'JWT, valid for 15 minutes.' } },
      },
      PropertySummary: {
        type: 'object',
        properties: { ...propertyFields, coverImage: { type: ['string', 'null'], format: 'uri' } },
      },
      Image: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '7' },
          url: { type: 'string', format: 'uri' },
          position: { type: 'integer', example: 0 },
        },
      },
      Property: {
        type: 'object',
        properties: {
          ...propertyFields,
          owner_id: { type: 'string', example: '6' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      PropertyDetail: {
        allOf: [ref('Property'), { type: 'object', properties: { images: { type: 'array', items: ref('Image') } } }],
      },
      Inquiry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          property_id: { type: 'string' },
          message: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      SentInquiry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          message: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          property_id: { type: 'string' },
          property_slug: { type: 'string' },
          property_title: { type: 'string' },
          property_city: { type: 'string' },
          property_locality: { type: 'string' },
          property_type: { type: 'string', enum: [...PROPERTY_TYPES] },
          property_price: { type: 'number' },
          coverImage: { type: ['string', 'null'], description: 'The listing photo, if it has one.' },
        },
      },
      ReceivedInquiry: {
        allOf: [
          ref('SentInquiry'),
          {
            type: 'object',
            properties: { sender_name: { type: 'string' }, sender_email: { type: 'string', format: 'email' } },
          },
        ],
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        description: 'Also sets the refresh token cookie. Limited to 10 per hour per IP.',
        requestBody: jsonBody(registerSchema),
        responses: {
          201: response('Account created', ref('AuthResponse')),
          400: error('Invalid input'),
          409: error('Email is already registered'),
          429: rateLimited,
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        description: 'Sets the refresh token cookie. Failed attempts are limited per IP and per email.',
        requestBody: jsonBody(loginSchema),
        responses: {
          200: response('Logged in', ref('AuthResponse')),
          400: error('Invalid input'),
          401: error('Invalid email or password'),
          429: rateLimited,
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Get a new access token',
        description:
          'Uses the refresh token cookie and replaces it. Reusing an old token cancels every token from that login.',
        responses: {
          200: response('New access token', {
            type: 'object',
            properties: { accessToken: { type: 'string' } },
          }),
          401: error('Invalid refresh token'),
          429: rateLimited,
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out',
        description: 'Cancels the tokens from this login and clears the cookie.',
        responses: { 204: response('Logged out') },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the logged-in user',
        security: secured,
        responses: {
          200: response('The user', { type: 'object', properties: { user: ref('User') } }),
          401: error('Authentication required'),
        },
      },
    },
    '/properties': {
      get: {
        tags: ['Properties'],
        summary: 'Search listings',
        description: 'Public. Uses cursor pagination, so each page stays fast at any depth.',
        parameters: [
          queryParam('city', 'Exact city, in any case.', { type: 'string', example: 'pune' }),
          queryParam('locality', 'Part of a locality name.', { type: 'string', example: 'ban' }),
          queryParam('type', 'Property type.', { type: 'string', enum: [...PROPERTY_TYPES] }),
          queryParam('bedrooms', 'Exact number of bedrooms.', { type: 'integer', minimum: 0, maximum: 50 }),
          queryParam('minPrice', 'Minimum budget.', { type: 'integer', minimum: 0 }),
          queryParam('maxPrice', 'Maximum budget.', { type: 'integer', minimum: 0 }),
          queryParam('sort', 'Sort order.', { type: 'string', enum: [...SORT_OPTIONS], default: 'newest' }),
          ...pageParams,
        ],
        responses: {
          200: response('A page of listings', page('PropertySummary')),
          400: error('Invalid filter or cursor'),
        },
      },
      post: {
        tags: ['Properties'],
        summary: 'Create a listing',
        security: secured,
        requestBody: jsonBody(createPropertySchema),
        responses: {
          201: response('Listing created', { type: 'object', properties: { property: ref('Property') } }),
          400: error('Invalid input'),
          401: error('Authentication required'),
          429: rateLimited,
        },
      },
    },
    '/properties/mine': {
      get: {
        tags: ['Properties'],
        summary: 'List my listings',
        description: 'Includes hidden listings, newest first.',
        security: secured,
        parameters: pageParams,
        responses: {
          200: response('A page of your listings', page('Property')),
          400: error('Invalid page settings'),
          401: error('Authentication required'),
        },
      },
    },
    '/properties/mine/{id}': {
      get: {
        tags: ['Properties'],
        summary: 'Get one of my listings',
        description: 'Used by the edit page. Unlike the public route, it also finds hidden listings.',
        security: secured,
        parameters: [pathParam('id', 'The listing id.')],
        responses: {
          200: response('The listing', { type: 'object', properties: { property: ref('PropertyDetail') } }),
          400: error('Invalid id'),
          401: error('Authentication required'),
          404: error('Property not found'),
        },
      },
    },
    '/properties/sitemap': {
      get: {
        tags: ['Properties'],
        summary: 'List listings for the sitemap',
        description: 'Public. Returns the slugs and update times of the newest 5,000 active listings.',
        responses: {
          200: response('Sitemap entries', {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { slug: { type: 'string' }, updated_at: { type: 'string', format: 'date-time' } },
                },
              },
            },
          }),
        },
      },
    },
    '/properties/{slug}': {
      get: {
        tags: ['Properties'],
        summary: 'Get a listing',
        description: 'Public. Hidden listings return 404.',
        parameters: [pathParam('slug', 'The listing slug.')],
        responses: {
          200: response('The listing', { type: 'object', properties: { property: ref('PropertyDetail') } }),
          404: error('Property not found'),
        },
      },
    },
    '/properties/{slug}/similar': {
      get: {
        tags: ['Properties'],
        summary: 'Get similar listings',
        description:
          'Public. Returns up to 6, closest bedrooms and price first: same city and type within 20% on price, then any price, then any type in the city.',
        parameters: [pathParam('slug', 'The listing slug.')],
        responses: {
          200: response('Similar listings', {
            type: 'object',
            properties: { items: { type: 'array', items: ref('PropertySummary') } },
          }),
          404: error('Property not found'),
        },
      },
    },
    '/properties/{id}': {
      patch: {
        tags: ['Properties'],
        summary: 'Edit my listing',
        description: 'Send only the fields to change. The slug stays the same.',
        security: secured,
        parameters: [pathParam('id', 'The listing id.')],
        requestBody: jsonBody(updatePropertySchema),
        responses: {
          200: response('Listing updated', { type: 'object', properties: { property: ref('Property') } }),
          400: error('Invalid input'),
          401: error('Authentication required'),
          403: error('Not your listing'),
          404: error('Property not found'),
          429: rateLimited,
        },
      },
      delete: {
        tags: ['Properties'],
        summary: 'Delete my listing',
        security: secured,
        parameters: [pathParam('id', 'The listing id.')],
        responses: {
          204: response('Listing deleted'),
          400: error('Invalid id'),
          401: error('Authentication required'),
          403: error('Not your listing'),
          404: error('Property not found'),
          429: rateLimited,
        },
      },
    },
    '/properties/{id}/images': {
      post: {
        tags: ['Images'],
        summary: 'Upload an image',
        description: 'JPEG, PNG or WebP, up to 5 MB, and up to 10 per listing. The file contents are checked.',
        security: secured,
        parameters: [pathParam('id', 'The listing id.')],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: { image: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          201: response('Image added', { type: 'object', properties: { image: ref('Image') } }),
          400: error('Missing or invalid image'),
          401: error('Authentication required'),
          403: error('Not your listing'),
          404: error('Property not found'),
          409: error('Too many images'),
          413: error('Image is larger than 5 MB'),
          429: rateLimited,
        },
      },
    },
    '/properties/{id}/images/{imageId}': {
      delete: {
        tags: ['Images'],
        summary: 'Delete an image',
        security: secured,
        parameters: [pathParam('id', 'The listing id.'), pathParam('imageId', 'The image id.')],
        responses: {
          204: response('Image deleted'),
          400: error('Invalid id'),
          401: error('Authentication required'),
          403: error('Not your listing'),
          404: error('Property or image not found'),
          429: rateLimited,
        },
      },
    },
    '/properties/{id}/inquiries': {
      post: {
        tags: ['Inquiries'],
        summary: 'Contact the owner',
        description:
          'One inquiry per user per listing. Limited to 10 per hour per user and 30 per hour per IP. Leave `website` empty: it is a spam trap.',
        security: secured,
        parameters: [pathParam('id', 'The listing id.')],
        requestBody: jsonBody(createInquirySchema),
        responses: {
          201: response('Inquiry sent', { type: 'object', properties: { inquiry: ref('Inquiry') } }),
          400: error('Invalid input'),
          401: error('Authentication required'),
          403: error('This is your own listing'),
          404: error('Property not found'),
          409: error('You already sent an inquiry for this listing'),
          429: rateLimited,
        },
      },
    },
    '/inquiries/received': {
      get: {
        tags: ['Inquiries'],
        summary: 'List inquiries on my listings',
        security: secured,
        parameters: pageParams,
        responses: {
          200: response('A page of inquiries', page('ReceivedInquiry')),
          400: error('Invalid page settings'),
          401: error('Authentication required'),
        },
      },
    },
    '/inquiries/sent': {
      get: {
        tags: ['Inquiries'],
        summary: 'List inquiries I sent',
        security: secured,
        parameters: pageParams,
        responses: {
          200: response('A page of inquiries', page('SentInquiry')),
          400: error('Invalid page settings'),
          401: error('Authentication required'),
        },
      },
    },
  },
};
