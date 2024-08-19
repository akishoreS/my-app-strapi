'use strict';

const jwt = require("jsonwebtoken");
/**
 * listing controller
 */

const { createCoreController } = require('@strapi/strapi').factories;


module.exports = createCoreController('api::listing.listing', ({ strapi }) => ({
async toggle_save_listing(ctx) {
  try {
    const { listing_id } = ctx.params;
    const user = ctx.state.user;

    // Find the listing and populate the saved_by relation
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

    // Check if the user has already saved the listing
    const isAlreadySaved = listing.saved_by.some(savedUser => savedUser.id === user.id);

    let updatedSavedBy;
    let message;

    if (isAlreadySaved) {
      // Unsave the listing (remove user from saved_by)
      updatedSavedBy = listing.saved_by.filter(savedUser => savedUser.id !== user.id);
      message = "Listing successfully unsaved.";
    } else {
      // Save the listing (add user to saved_by)
      updatedSavedBy = [...listing.saved_by, user];
      message = "Listing successfully saved.";
    }

    // Update the listing with the modified saved_by array
    const updatedListing = await strapi.entityService.update('api::listing.listing', listing_id, {
      data: { saved_by: updatedSavedBy },
    });

    return ctx.send({ status: true, message, data: updatedListing }, 200);
  } catch (err) {
    console.error('Error:', err);
    return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
  }
},
  async create(ctx){
    const user = ctx.state.user;
    if (!user){
        return ctx.unauthorized('You must be logged in to create a listing');
    }
    console.log('Logged in user:', user.id);
    console.log('Request body before setting listed_by:', ctx.request.body);

    ctx.request.body.data.listed_by= user.id;
    ctx.request.body.data.publishedAt = null;
    console.log('Request body after setting listed_by:', ctx.request.body);
    const response = await super.create(ctx);

    console.log('New listing created:');
    const count = await strapi.query('api::listing.listing').count({
        where: { listed_by: user.id },
      });
      console.log('Number of listings by user:', count);
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
            property_details: true,
            Admin_inputs: {
              populate: {
                property_review: {
                  populate: { admin_user: true },
                },
                user_review: {
                  populate: { admin_user: true },
                },
              },
              saved_by:true,
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
            filters: {
              publishedAt: {
                  $notNull: true,
              },
            },
            populate: {
              listed_by: true,
              site_details: true,
              user_details: true,
              Resources: true,
              investment_details: {
                populate:{
                  investment_thesis:true
                }
              },
              Pricing: {
                populate:{
                  amount_breakdown:true,
                }
              },
              Location: true,
              property_details:true,
              Admin_inputs: true,
              saved_by: true
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

          return this.transformResponse(transformedListings);
        } catch (error) {
          console.error('Error in find method:', error);
          ctx.throw(500, 'Internal Server Error');
        }
      },
      async findOne(ctx) {
        function calculateAverageRating(reviews) {
            if (!reviews || reviews.length === 0) {
              return 0;
            }
            const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
            return totalRating / reviews.length;
          }
        
        const { id } = ctx.params;
    
        
        if (isNaN(id)) {
          return ctx.badRequest('ID must be a number');
        }
    
        
        const listing = await strapi.entityService.findOne('api::listing.listing', id, {
          populate: {
            listed_by: true,
            site_details: true,
            user_details: true,
            Resources: true,
            investment_details: {
              populate:{
                investment_thesis:true
              }
            },
            Pricing: {
              populate:{
                amount_breakdown:true,
              }
            },
            Location: true,
            property_details:true,
            Admin_inputs: true,
            saved_by: true, 
          },
        });
    
        if (!listing) {
          return ctx.notFound('Listing not found');
        }
    
        // Transform the listing if necessary
        const transformedListing = {
          ...listing,
          propertyAverageRating: calculateAverageRating(listing.Admin_inputs?.property_review),
          propertyReviewCount: listing.Admin_inputs?.property_review?.length || 0,
          userAverageRating: calculateAverageRating(listing.Admin_inputs?.user_review),
          userReviewCount: listing.Admin_inputs?.user_review?.length || 0,
        };
    
        return this.transformResponse(transformedListing);
    },
    
  async listed_properties(ctx) {
    try {
      const user = ctx.state.user;
      const listings = await strapi.entityService.findMany('api::listing.listing', {
        filters: {
          listed_by: user.id
        },
        populate: {
          saved_by: true
        }
      });

      return ctx.send({ status: true, message: "Listed properties.", data: listings }, 200);
    } catch (err) {
      console.error('Error:', err);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
    }
  },
    }));

