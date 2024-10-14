'use strict';

const jwt = require("jsonwebtoken");
/**
 * listing controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const axios = require('axios'); 

module.exports = createCoreController('api::listing.listing', ({ strapi }) => ({
  async sharePropertyLink (ctx ) {
    try {
      const { propertyId } = ctx.params;
  
      // Fetch property details from the database
      const property =await strapi.entityService.findOne('api::listing.listing', propertyId, {
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
          Admin_inputs: {
            populate:{
              property_review:true,
              user_review:true
            }
          },
          saved_by: true, 
        },
      });
  
      if (!property) {
        return ctx.send({ status: false, message: "Property not found." }, 404);
      }
      console.log(property)
      // Firebase Dynamic Link API call
      const firebaseResponse = await axios.post(
        `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key= AIzaSyAukOIcatXurYv8GUpCliapV6vm_C4mIwU`,
        {
          dynamicLinkInfo: {
            domainUriPrefix: "https://bhumiii.page.link", // Your Firebase dynamic link domain
            link: `http://localhost:1337/property/${propertyId}`, // Local deep link for testing
            androidInfo: {
              androidPackageName: "com.bhumii.app", // Your Android package name
            },
            iosInfo: {
              iosBundleId: "com.bhumii.app", // Your iOS bundle ID
            },
          },
        }
      );
  
      const dynamicLink = firebaseResponse.data.shortLink;
  
      return ctx.send({
        status: true,
        message: "Shareable link created successfully.",
        data: { link: dynamicLink },
      }, 200);
    } catch (err) {
      console.error('Error in sharePropertyLink:', err);
      return ctx.send({ status: false, message: 'Internal Server Error.', error: err }, 500);
    }
    },
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
    const {user} = ctx.state;
    if (!user){
        return ctx.unauthorized('You must be logged in to create a listing');
    }
    ctx.request.body.data.listed_by= user.id;
    ctx.request.body.data.publishedAt = null;
    const response = await super.create(ctx);
    const count = await strapi.query('api::listing.listing').count({
        where: { listed_by: user.id },
      });
          const updatedUser=await strapi.query('plugin::users-permissions.user').update({
            where: { id: user.id },
            data: {
              no_of_listings: count,
            },
          });

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
            user_details: true,
            Location: true,
            property_details: true,
            Admin_inputs:true,
            saved_by:true,
          },
        });
        const activeViewCounts = await Promise.all(
          listings.map(async (listing) => {
            const count = await strapi.entityService.count('api::view.view', {
              filters: {
                listing: listing.id,
                user: { $notNull: true } 
              }
            });
            return { listingId: listing.id, activeViewCount: count };
          })
        );
      
        const transformedListings = listings.map((listing) => {
            const viewCountData = activeViewCounts.find(item => item.listingId === listing.id);
            return {
              ...listing,
              activeViewCount: viewCountData ? viewCountData.activeViewCount : 0 
            };
          });
          return this.transformResponse(transformedListings);
    },
  async find(ctx) {
        try {
          const { query } = ctx;
          const filters = {
            publishedAt: {
              $notNull: true,
            },
          };
    const listings = await strapi.entityService.findMany('api::listing.listing', {
      filters: filters,
            populate: {
              user_details: true,
              Location: true,
              property_details: true,
              Admin_inputs: true,
              saved_by: true
            },
          });
          const filteredListings = listings.filter(listing => {
            let locationMatches = true;
            let companyMatches = true;

            // Filter by location if provided
            if (query.location) {
                locationMatches = listing.Location.some(loc => 
                    loc.Address && loc.Address.toLowerCase().includes(query.location.toLowerCase())
                );
            }

            // Filter by company name if provided
            if (query.company_name) {
                companyMatches = listing.user_details.company_name &&
                    listing.user_details.company_name.toLowerCase().includes(query.company_name.toLowerCase());
            }

            // Include the listing if both filters match
            return locationMatches && companyMatches;
        });
      
          const transformedListings = filteredListings.map(listing => {
            const isSaved = ctx.state.user 
                ? listing.saved_by.some(savedUser => savedUser.id === ctx.state.user.id)
                : false;
            return {
                ...listing,
                isSaved,
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
          // Check if the user is authenticated
          if (ctx.state.user) {
            // Create a new view entry
            await strapi.entityService.create('api::view.view', {
              data: {
                listing: id,
                user: ctx.state.user.id
              }
            });
          }
        
          const activeViewCount = await strapi.entityService.count('api::view.view', {
            filters: {
              listing: id,
              user: { $notNull: true } // Only consider views with associated users
            }
          });
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
            Admin_inputs: {
              populate:{
                property_review:true,
                user_review:true
              }
            },
            saved_by:true, 
          },
        });

        if (!listing) {
          return ctx.notFound('Listing not found');
        }
        const isSaved = ctx.state.user 
        ? listing.saved_by.some(savedUser => savedUser.id === ctx.state.user.id)
        : false; 
        const savedBy = listing.saved_by && listing.saved_by.length === 0 ? null : listing.saved_by;
        // Transform the listing if necessary
        const transformedListing = {
          ...listing,
          propertyAverageRating: calculateAverageRating(listing.Admin_inputs?.property_review),
          propertyReviewCount: listing.Admin_inputs?.property_review?.length || 0,
          userAverageRating: calculateAverageRating(listing.Admin_inputs?.user_review),
          userReviewCount: listing.Admin_inputs?.user_review?.length || 0,
          isSaved,
          activeViewCount,
          saved_by:savedBy
        };
        return this.transformResponse(transformedListing);
    },
  async decreaseViewCount(ctx) {
      const { id } = ctx.params; // Property ID
      const user = ctx.state.user; // Authenticated user
  
      try {
        if (!user) {
          return ctx.unauthorized('You must be logged in to decrease a view.');
        }
  
        // Find the view entry related to this listing and user
        const viewEntry = await strapi.entityService.findMany('api::view.view', {
          filters: {
            listing: id,
            user: user.id,
          },
          limit: 1, // We only expect one view entry per user per listing
        });
  
        if (!viewEntry || viewEntry.length === 0) {
          return ctx.send({
            status: false,
            message: 'No active view found for this property.',
          }, 404);
        }
  
        // Delete the view entry for the current user and listing
        await strapi.entityService.delete('api::view.view', viewEntry[0].id);
  
        return ctx.send({
          status: true,
          message: 'View count decreased successfully.',
        });
      } catch (error) {
        console.error('Error decreasing view count:', error);
        return ctx.send({
          status: false,
          message: 'Internal Server Error. Could not decrease view count.',
        }, 500);
      }
    },
    }));
