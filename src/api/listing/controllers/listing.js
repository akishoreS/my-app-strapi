'use strict';

const jwt = require("jsonwebtoken");
/**
 * listing controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::listing.listing', ({ strapi }) => ({
  async save_listing(ctx) {
    try {
      const { listing_id } = ctx.params;
      const user = ctx.state.user;
      console.log(user);
      console.log(listing_id, "Listing Id");
      const listing = await strapi.entityService.findOne('api::listing.listing', listing_id, {
        populate: {
          saved_by: true
        }
      });
      if (!listing) {
       return ctx.send({
          status: false,
          message: "Listing not found",
        }, 404);
      }
      const updatedSavedBy = listing.saved_by ? [...listing.saved_by, user.id] : [user.id];
      const updatedListing = await strapi.entityService.update('api::listing.listing', listing_id, {
        data: { saved_by: updatedSavedBy },
      });
      return ctx.send({ status: true, message: "Listing successfully saved.", data: updatedListing }, 200);
    } catch (err) {
      console.error('Error:', err);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
    }
  },
  async unsave_listing(ctx) {
    try {
      const { listing_id } = ctx.params;
      const user = ctx.state.user;
      console.log(user);
      console.log(listing_id, "Listing Id");
      const listing = await strapi.entityService.findOne('api::listing.listing', listing_id, {
        populate: {
          saved_by: true
        }
      });
      if (!listing) {
       return ctx.send({
          status: false,
          message: "Listing not found",
        }, 404);
      }
      const updatedSavedBy = (listing.saved_by || []).filter(userId => userId.id !== user.id);
      const updatedListing = await strapi.entityService.update('api::listing.listing', listing_id, {
        data: { saved_by: updatedSavedBy },
      });
      return ctx.send({ status: true, message: "Listing successfully unsaved.", data: updatedListing }, 200);
    } catch (err) {
      console.error('Error:', err);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
    }
  },
}));

