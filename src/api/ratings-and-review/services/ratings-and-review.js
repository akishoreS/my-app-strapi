'use strict';

/**
 * ratings-and-review service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::ratings-and-review.ratings-and-review');
