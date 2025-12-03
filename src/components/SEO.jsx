import { Helmet } from 'react-helmet-async';
import { getSeoProps } from '@/config/seoConfig';

const SEO = ({ path, customTitle, customDescription, customKeywords, faqSchema }) => {
  const seoProps = getSeoProps(path);
  
  const title = customTitle || seoProps.title;
  const description = customDescription || seoProps.description;
  const keywords = customKeywords || seoProps.keywords;
  
  const schemas = Array.isArray(seoProps.schemaData) 
    ? seoProps.schemaData 
    : [seoProps.schemaData];
  
  if (faqSchema) {
    schemas.push(faqSchema);
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={seoProps.canonicalUrl} />
      
      {seoProps.shouldIndex ? (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      ) : (
        <meta name="robots" content="noindex, nofollow" />
      )}
      
      <meta property="og:title" content={seoProps.ogData.title} />
      <meta property="og:description" content={seoProps.ogData.description} />
      <meta property="og:type" content={seoProps.ogData.type} />
      <meta property="og:url" content={seoProps.ogData.url} />
      <meta property="og:image" content={seoProps.ogData.image} />
      <meta property="og:site_name" content="Ashwheel" />
      <meta property="og:locale" content="en_IN" />
      
      <meta name="twitter:card" content={seoProps.twitterData.card} />
      <meta name="twitter:title" content={seoProps.twitterData.title} />
      <meta name="twitter:description" content={seoProps.twitterData.description} />
      <meta name="twitter:image" content={seoProps.twitterData.image} />
      <meta name="twitter:site" content="@ash_mzp" />
      
      <meta name="author" content="Ashwheel" />
      <meta name="language" content="English" />
      <meta name="geo.region" content="IN" />
      <meta name="geo.placename" content="India" />
      
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
