import React from 'react';
import { Helmet } from 'react-helmet-async';

const SeoWrapper = ({ children, title, description, keywords, canonicalUrl, shouldIndex = true, ogData, twitterData, schemaData }) => {
    const defaultOgImage = 'https://storage.googleapis.com/hostinger-horizons-assets-prod/8e45b175-3dfd-4e9f-a234-534458b8b898/6089a943f825cdc819dd37ea93ad9aa9.png';
    return (
        <>
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
                <meta name="keywords" content={keywords} />
                {shouldIndex ? (
                    <meta name="robots" content="index, follow" />
                ) : (
                    <meta name="robots" content="noindex, nofollow" />
                )}
                <link rel="canonical" href={canonicalUrl} />
                {ogData && (
                    <>
                        <meta property="og:title" content={ogData.title} />
                        <meta property="og:description" content={ogData.description} />
                        <meta property="og:type" content={ogData.type || 'website'} />
                        <meta property="og:url" content={canonicalUrl} />
                        <meta property="og:image" content={ogData.image || defaultOgImage} />
                        <meta property="og:image:width" content="1200" />
                        <meta property="og:image:height" content="630" />
                        <meta property="og:site_name" content="Ashwheel" />
                    </>
                )}
                {twitterData && (
                    <>
                        <meta name="twitter:card" content={twitterData.card || 'summary_large_image'} />
                        <meta name="twitter:title" content={twitterData.title} />
                        <meta name="twitter:description" content={twitterData.description} />
                        <meta name="twitter:image" content={twitterData.image || defaultOgImage} />
                    </>
                )}
                {schemaData && <script type="application/ld+json">{JSON.stringify(schemaData)}</script>}
            </Helmet>
            {children}
        </>
    );
};

export default SeoWrapper;