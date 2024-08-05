import type { Schema, Attribute } from '@strapi/strapi';

export interface UserReviewUserReview extends Schema.Component {
  collectionName: 'components_user_review_user_reviews';
  info: {
    displayName: 'user_review';
    icon: 'file';
  };
  attributes: {
    rating: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 5;
        },
        number
      >;
    review: Attribute.Blocks;
    admin_user: Attribute.Relation<
      'user-review.user-review',
      'oneToOne',
      'admin::user'
    >;
  };
}

export interface UserInfoUserDetails extends Schema.Component {
  collectionName: 'components_user_info_user_details';
  info: {
    displayName: 'user_details';
    icon: 'user';
  };
  attributes: {
    user_name: Attribute.String & Attribute.Required;
    company_name: Attribute.String & Attribute.Required;
    company_logo: Attribute.Media<'images'>;
    country_code: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'+91'>;
    phone_number: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 10;
      }>;
    user_city: Attribute.String & Attribute.Required;
    user_address: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
    previous_work_details: Attribute.Media<
      'files' | 'videos' | 'images',
      true
    > &
      Attribute.Required;
  };
}

export interface SiteInfoSiteDetails extends Schema.Component {
  collectionName: 'components_site_info_site_details';
  info: {
    displayName: 'site_details';
    icon: 'pin';
  };
  attributes: {
    site_description: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    site_total_area: Attribute.Decimal & Attribute.DefaultTo<0>;
    site_blueprint: Attribute.Media<'images'>;
  };
}

export interface ResourcesResources extends Schema.Component {
  collectionName: 'components_resources_resources';
  info: {
    displayName: 'Resources';
    icon: 'filePdf';
  };
  attributes: {
    investment_memo: Attribute.Media<'files'> & Attribute.Private;
    financial_calculator: Attribute.Media<'files'> & Attribute.Private;
  };
}

export interface ProperyReviewPropertyReview extends Schema.Component {
  collectionName: 'components_prop_review_prop_reviews';
  info: {
    displayName: 'prop_rev';
    icon: 'file';
  };
  attributes: {
    rating: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 5;
        },
        number
      >;
    review: Attribute.Blocks;
    admin_user: Attribute.Relation<
      'propery-review.property-review',
      'oneToOne',
      'admin::user'
    >;
  };
}

export interface PropertyPropertyDetails extends Schema.Component {
  collectionName: 'components_property_property_details';
  info: {
    displayName: 'property_details';
    icon: 'pinMap';
    description: '';
  };
  attributes: {
    property_photos: Attribute.Media<'images', true> & Attribute.Required;
    property_overview: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    Location: Attribute.Component<'property.location'>;
  };
}

export interface PropertyLocation extends Schema.Component {
  collectionName: 'components_property_locations';
  info: {
    displayName: 'Location';
  };
  attributes: {
    Latitude: Attribute.Decimal;
    longitude: Attribute.Decimal;
  };
}

export interface InvestmentInvestmentThesis extends Schema.Component {
  collectionName: 'components_investment_investment_theses';
  info: {
    displayName: 'investment_thesis';
    icon: 'priceTag';
  };
  attributes: {
    header: Attribute.String & Attribute.Required;
    description: Attribute.Text &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
  };
}

export interface InvestmentInvestmentDetails extends Schema.Component {
  collectionName: 'components_investment_investment_details';
  info: {
    displayName: 'Investment_details';
    icon: 'stack';
    description: '';
  };
  attributes: {
    current_funding_details: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    investment_deck: Attribute.Media<'files'>;
    financial_plan: Attribute.Media<'images' | 'files'>;
    investment_thesis: Attribute.Component<
      'investment.investment-thesis',
      true
    >;
  };
}

export interface AmountAmount extends Schema.Component {
  collectionName: 'components_amount_amounts';
  info: {
    displayName: 'amount';
    icon: 'database';
  };
  attributes: {
    total_amount: Attribute.Integer &
      Attribute.Required &
      Attribute.DefaultTo<0>;
    amount_breakdown: Attribute.Component<'amount.amount-breakage', true>;
  };
}

export interface AmountAmountBreakage extends Schema.Component {
  collectionName: 'components_amount_amount_breakages';
  info: {
    displayName: 'amount_breakage';
    icon: 'layer';
  };
  attributes: {
    expense_type: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 15;
      }>;
    cost: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface AdminUseForAdminUseOnly extends Schema.Component {
  collectionName: 'components_admin_use_for_admin_use_onlies';
  info: {
    displayName: 'for_admin_use_only';
    icon: 'lock';
    description: '';
  };
  attributes: {
    property_review: Attribute.Component<
      'propery-review.property-review',
      true
    >;
    user_review: Attribute.Component<'user-review.user-review', true>;
    status: Attribute.Boolean;
    totally_funded: Attribute.Boolean;
    target_irr: Attribute.Decimal &
      Attribute.SetMinMax<
        {
          max: 100;
        },
        number
      >;
    yield: Attribute.Decimal &
      Attribute.SetMinMax<
        {
          max: 100;
        },
        number
      >;
    asset_value: Attribute.Decimal;
    funded_value: Attribute.Decimal;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'user-review.user-review': UserReviewUserReview;
      'user-info.user-details': UserInfoUserDetails;
      'site-info.site-details': SiteInfoSiteDetails;
      'resources.resources': ResourcesResources;
      'propery-review.property-review': ProperyReviewPropertyReview;
      'property.property-details': PropertyPropertyDetails;
      'property.location': PropertyLocation;
      'investment.investment-thesis': InvestmentInvestmentThesis;
      'investment.investment-details': InvestmentInvestmentDetails;
      'amount.amount': AmountAmount;
      'amount.amount-breakage': AmountAmountBreakage;
      'admin-use.for-admin-use-only': AdminUseForAdminUseOnly;
    }
  }
}
