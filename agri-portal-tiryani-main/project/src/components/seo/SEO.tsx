import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.tiryaniagriportal.in';
const SITE_NAME = 'AGRONIX';
const DEFAULT_DESCRIPTION = 'AGRONIX - Agriculture Intelligence Platform';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
}

const PAGE_SEO: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'AGRONIX',
    description: 'AGRONIX - Agriculture Intelligence Platform. Farmer database, crop advisory, fertilizer calculator, dealer monitoring, statutory forms, and government schemes.',
  },
  '/dashboard': {
    title: 'Dashboard | AGRONIX',
    description: 'Access your dashboard for farmer services, crop advisory, stock inventory, and agriculture department tools.',
  },
  '/dealers': {
    title: 'Dealer Management | AGRONIX',
    description: 'Monitor fertilizer dealers, stock inventory, and distribution in Tiryani Mandal, Telangana.',
  },
  '/farmer-database': {
    title: 'Farmer Database | AGRONIX',
    description: 'Comprehensive farmer database for Tiryani Mandal with land records, crop details, and government scheme eligibility.',
  },
  '/crops': {
    title: 'Crop Management | AGRONIX',
    description: 'Crop advisory, pest management, and cultivation guidance for farmers in Tiryani Mandal, Telangana.',
  },
  '/crop-cotton': {
    title: 'Cotton Crop Advisory | AGRONIX',
    description: 'Cotton cultivation guidance, pest management, and market information for Tiryani farmers.',
  },
  '/crop-paddy': {
    title: 'Paddy Crop Advisory | AGRONIX',
    description: 'Paddy cultivation guidance, pest management, and market information for Tiryani farmers.',
  },
  '/crop-maize': {
    title: 'Maize Crop Advisory | AGRONIX',
    description: 'Maize cultivation guidance, pest management, and market information for Tiryani farmers.',
  },
  '/crop-pulses': {
    title: 'Pulses Crop Advisory | AGRONIX',
    description: 'Pulses cultivation guidance, pest management, and market information for Tiryani farmers.',
  },
  '/crop-oilseeds': {
    title: 'Oilseeds Crop Advisory | AGRONIX',
    description: 'Oilseeds cultivation guidance, pest management, and market information for Tiryani farmers.',
  },
  '/forms': {
    title: 'Forms Downloads | AGRONIX',
    description: 'Download agriculture department forms, statutory forms, and application templates for farmers and dealers.',
  },
  '/gos-circulars': {
    title: 'GOs & Circulars | AGRONIX',
    description: 'Government orders, circulars, and notifications from Telangana Agriculture Department.',
  },
  '/quality': {
    title: 'Quality Control | AGRONIX',
    description: 'Quality control for seeds, fertilizers, and pesticides in Tiryani Mandal.',
  },
  '/quality-seeds': {
    title: 'Seed Quality Control | AGRONIX',
    description: 'Seed sampling, testing, and quality certification services for Tiryani farmers.',
  },
  '/quality-pesticides': {
    title: 'Pesticide Quality Control | AGRONIX',
    description: 'Pesticide sampling, testing, and quality monitoring in Tiryani Mandal.',
  },
  '/quality-fertilizers': {
    title: 'Fertilizer Quality Control | AGRONIX',
    description: 'Fertilizer sampling, testing, and quality monitoring services in Tiryani Mandal.',
  },
  '/farm-mechanization': {
    title: 'Farm Mechanization | AGRONIX',
    description: 'Farm machinery, equipment, and mechanization services for Tiryani farmers.',
  },
  '/excel': {
    title: 'Excel Uploads | AGRONIX',
    description: 'Upload and manage Excel data for farmer database, stock inventory, and agriculture records.',
  },
  '/file-directory': {
    title: 'File Directory | AGRONIX',
    description: 'Access agriculture department files, documents, and resources for Tiryani Mandal.',
  },
  '/subsidy': {
    title: 'Subsidy Tracking | AGRONIX',
    description: 'Track government subsidies, NFSM, and state seed subsidies for Tiryani farmers.',
  },
  '/officer-toolkit': {
    title: 'Officer Toolkit | AGRONIX',
    description: 'Tools for agriculture officers including calculators, statutory forms, and legal ready reckoner.',
  },
  '/officer-toolkit/farm-calculators': {
    title: 'Farm Calculators | AGRONIX',
    description: 'Acreage calculator, seed rate calculator, plant population calculator for Tiryani farmers.',
  },
  '/officer-toolkit/fertilizer-calculator': {
    title: 'Fertilizer Calculator | AGRONIX',
    description: 'Calculate fertilizer requirements based on crop, soil, and area for Tiryani farmers.',
  },
  '/officer-toolkit/crop-protection': {
    title: 'Crop Protection Tool | AGRONIX',
    description: 'Pesticide calculator and crop protection guidance for Tiryani farmers.',
  },
  '/officer-toolkit/pesticide-calculator': {
    title: 'Pesticide Calculator | AGRONIX',
    description: 'Calculate pesticide dosage and application rates for crop protection in Tiryani.',
  },
  '/officer-toolkit/plant-population-calculator': {
    title: 'Plant Population Calculator | AGRONIX',
    description: 'Calculate optimal plant population for various crops in Tiryani Mandal.',
  },
  '/officer-toolkit/seed-rate-calculator': {
    title: 'Seed Rate Calculator | AGRONIX',
    description: 'Calculate seed requirements based on area and crop variety for Tiryani farmers.',
  },
  '/officer-toolkit/legal-ready-reckoner': {
    title: 'Legal Ready Reckoner | AGRONIX',
    description: 'Agriculture laws, FCO clauses, offences, and legal reference for officers and farmers.',
  },
  '/analytics': {
    title: 'Analytics | AGRONIX',
    description: 'Agriculture analytics, reports, and data insights for Tiryani Mandal.',
  },
  '/settings': {
    title: 'Settings | AGRONIX',
    description: 'Manage your account settings, preferences, and profile information.',
  },
  '/dealer-portal': {
    title: 'Dealer Stock Portal | AGRONIX',
    description: 'Fertilizer dealer stock management, inventory tracking, and reporting system.',
  },
  '/stock-analytics': {
    title: 'Stock Analytics | AGRONIX',
    description: 'Fertilizer stock analytics, trends, and inventory insights for Tiryani Mandal.',
  },
  '/stock-receipts-sales': {
    title: 'Stock Receipts & Sales | AGRONIX',
    description: 'Track fertilizer stock receipts, sales, and distribution in Tiryani Mandal.',
  },
};

export function SEO({ title, description, image, noIndex, structuredData }: SEOProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const pageSEO = PAGE_SEO[currentPath] || {};
  const pageTitle = title || pageSEO.title || SITE_NAME;
  const pageDescription = description || pageSEO.description || DEFAULT_DESCRIPTION;
  const pageImage = image || `${SITE_URL}/images/agri-emerald-512.webp`;
  const canonicalUrl = `${SITE_URL}${currentPath}`;

  const jsonLd = structuredData || {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'AGRONIX',
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      '@type': 'GovernmentOrganization',
      name: 'Department of Agriculture, Telangana',
      areaServed: {
        '@type': 'AdministrativeArea',
        name: 'Tiryani Mandal, Kumram Bheem Asifabad District, Telangana'
      }
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={canonicalUrl} />
      
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:image:alt" content={`${SITE_NAME} logo`} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      
      {/* Additional SEO */}
      <meta name="keywords" content="Tiryani, AGRONIX, Agriculture Department Tiryani, Kumuram Bheem Asifabad, Telangana Agriculture, Crop Advisory, Weather, Farmer Services, Agriculture Portal, Government Schemes" />
      <meta name="author" content="Department of Agriculture, Telangana" />
      <meta name="theme-color" content="#0f766e" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; path: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`
    }))
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(schema)}
    </script>
  );
}

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentOrganization',
    name: 'Department of Agriculture, Telangana',
    alternateName: 'AGRONIX',
    url: SITE_URL,
    logo: `${SITE_URL}/images/agri-emerald-512.webp`,
    description: 'Agriculture Department serving Tiryani Mandal, Kumram Bheem Asifabad District, Telangana',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Tiryani',
      addressRegion: 'Telangana',
      addressCountry: 'IN'
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Tiryani Mandal, Kumram Bheem Asifabad District, Telangana'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Telugu']
    }
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(schema)}
    </script>
  );
}
