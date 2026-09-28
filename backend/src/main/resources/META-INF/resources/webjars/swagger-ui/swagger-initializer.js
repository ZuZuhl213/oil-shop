window.onload = function() {
  // Inject HM Naturals Custom Theme
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = '/swagger-custom.css';
  document.head.appendChild(link);

  // Initialize Swagger UI
  window.ui = SwaggerUIBundle({
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout",
    configUrl: "/v3/api-docs/swagger-config"
  });
};
