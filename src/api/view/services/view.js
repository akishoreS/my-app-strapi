'use strict';

/**
 * view service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::view.view');
