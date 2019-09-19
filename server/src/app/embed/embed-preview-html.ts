import { EmbedPreview } from '../../interfaces/embed';

export const PREVIEW_HTML = ({ imageUrl, width, height, title, description }: EmbedPreview) => `
<!DOCTYPE html>
<html lang="en" prefix="og: http://ogp.me/ns#">
<head>
<meta charset="utf-8">
<meta name="twitter:card" content="summary_large_image">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="${width}">
<meta property="og:image:height" content="${height}">
<meta property="og:image:type" content="image/jpeg"/>
<meta property="og:image:alt" content="dollarstreet.org page preview"/>
<meta property="og:title" content="${title}">
<meta property="og:type" content="article">
<meta property="og:description" content="${description}">
<meta name="twitter:title" content="${title}">
<meta name="twitter:image" content="${imageUrl}">
<meta name="twitter:image:alt" content="dollarstreet.org page preview" />
<meta name="twitter:description" content="${description}">
<meta name="twitter:creator"  content="@dollarstreet_">
<meta name="twitter:site"  content="@dollarstreet_">
<meta property="fb:app_id" content="135732313883245">
<meta name="twitter:widgets:new-embed-design" content="on"/>
<meta name="twitter:widgets:csp" content="on"/>
</head>
<body></body>
</html>`;
