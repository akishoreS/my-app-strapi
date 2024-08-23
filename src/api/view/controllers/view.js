'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::view.view', ({ strapi }) => ({
  async deleteView(ctx) {
    const { id } = ctx.params; // Assuming you're passing the view ID in the URL

    try {
      const deletedView = await strapi.entityService.delete('api::view.view', id);
      return ctx.send({
        status: true,
        message: 'View deleted successfully.',
        data: deletedView
      });
    } catch (err) {
      console.error('Error deleting view:', err);
      return ctx.internalServerError('An error occurred while deleting the view.');
    }
  },
}));