'use strict';

/**
 * listing controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::listing.listing', ({ strapi }) => ({
    async create(ctx){
        const user = ctx.state.user;
        if (!user){
            return ctx.unauthorized('You must be logged in to create a listing');
        }
        console.log('Logged in user:', user.id);
        ctx.request.body.data.listed_by= user.id;

        const response = await super.create(ctx);
        console.log('New listing created:');
        const count = await strapi.query('api::listing.listing').count({
            where: { listed_by: user.id },
          });
          console.log('Number of listings by user:', count);

      
          // Update the user's number of listings
          const updatedUser=await strapi.query('plugin::users-permissions.user').update({
            where: { id: user.id },
            data: {
              no_of_listings: count,
            },
          });
          console.log('User updated:', updatedUser);

        return response;
    
    },
    async findMyListings(ctx) {
        const { user } = ctx.state;
        if (!user) {
          return ctx.unauthorized('You must be logged in to view your listings');
        }
    
        const listings = await strapi.entityService.findMany('api::listing.listing', {
          filters: { listed_by: user.id },
          populate: {
            listed_by: true,
            site_details: true,
            user_details: true,
            Resources: true,
            investment_details: true,
            amount_breakdown: true,
            Location: true,
            Admin_inputs: {
              populate: {
                property_review: {
                  populate: { admin_user: true },
                },
                user_review: {
                  populate: { admin_user: true },
                },
              },
            },
          }, // Populate all necessary relations
        });
        const transformedListings = listings.map((listing) => {
            const propertyReviews = listing.Admin_inputs?.property_review || [];
            const userReviews = listing.Admin_inputs?.user_review || [];
            
            const propertyRatings = propertyReviews.map((review) => review.rating);
            const userRatings = userReviews.map((review) => review.rating);
            
            const propertyAverageRating = propertyRatings.length
              ? propertyRatings.reduce((a, b) => a + b, 0) / propertyRatings.length
              : 0;
            const userAverageRating = userRatings.length
              ? userRatings.reduce((a, b) => a + b, 0) / userRatings.length
              : 0;
            
            return {
              ...listing,
              propertyAverageRating,
              propertyReviewCount: propertyReviews.length,
              userAverageRating,
              userReviewCount: userReviews.length,
            };
          });
    
          console.log('Transformed listings:', transformedListings);
    
          return this.transformResponse(transformedListings);
    
        // return ctx.send({ data: listings });
      },
    
      // Method to get reviews and ratings for listings
      async getListingReviews(ctx) {
        const { id } = ctx.params;
    
        const listing = await strapi.entityService.findOne('api::listing.listing', id, {
          populate: {
            Admin_inputs: {
              populate: {
                property_review: true,
                user_review: true,
              },
            },
          },
        });
    
        if (!listing) {
          return ctx.notFound('Listing not found');
        }
    
        const propertyReviews = listing.Admin_inputs.property_review;
        const userReviews = listing.Admin_inputs.user_review;
    
        const calculateAverageRating = (reviews) => {
          if (reviews.length === 0) return 0;
          const total = reviews.reduce((sum, review) => sum + review.rating, 0);
          return total / reviews.length;
        };
    
        const propertyAverageRating = calculateAverageRating(propertyReviews);
        const userAverageRating = calculateAverageRating(userReviews);
    
        return ctx.send({
          propertyReviews,
          userReviews,
          propertyAverageRating,
          userAverageRating,
        });
      },
      async find(ctx) {
        try {
          console.log('Context:', ctx);
    
          // Fetch all listings with nested population
          const { query } = ctx;
          console.log('Query:', query);
    
          const listings = await strapi.entityService.findMany('api::listing.listing', {
            // filters: query.filters,
            populate: {
              listed_by: true,
              site_details: true,
              user_details: true,
              Resources: true,
              investment_details: true,
              amount_breakdown: true,
              Location: true,
              Admin_inputs: {
                populate: {
                  property_review: {
                    populate: { admin_user: true },
                  },
                  user_review: {
                    populate: { admin_user: true },
                  },
                },
              },
            },
          });

    
          // Calculate reviews and ratings
          const transformedListings = listings.map((listing) => {
            const propertyReviews = listing.Admin_inputs?.property_review || [];
            const userReviews = listing.Admin_inputs?.user_review || [];
            
            const propertyRatings = propertyReviews.map((review) => review.rating);
            const userRatings = userReviews.map((review) => review.rating);
            
            const propertyAverageRating = propertyRatings.length
              ? propertyRatings.reduce((a, b) => a + b, 0) / propertyRatings.length
              : 0;
            const userAverageRating = userRatings.length
              ? userRatings.reduce((a, b) => a + b, 0) / userRatings.length
              : 0;
            
            return {
              ...listing,
              propertyAverageRating,
              propertyReviewCount: propertyReviews.length,
              userAverageRating,
              userReviewCount: userReviews.length,
            };
          });
    
          console.log('Transformed listings:', transformedListings);
    
          return this.transformResponse(transformedListings);
        } catch (error) {
          console.error('Error in find method:', error);
          ctx.throw(500, 'Internal Server Error');
        }
      },
    }));