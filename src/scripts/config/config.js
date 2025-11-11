const CONFIG = {
  BASE_URL: "https://story-api.dicoding.dev/v1",
  DEFAULT_LANGUAGE: "id",
  CACHE_NAME: "StoryMapCache-v1",
  MAP_CONFIG: {
    DEFAULT_LAT: -6.2088,
    DEFAULT_LNG: 106.8456,
    DEFAULT_ZOOM: 5,
    MAX_ZOOM: 18,
    MIN_ZOOM: 2,
  },
  TILE_LAYERS: {
    openStreetMap: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      name: "OpenStreetMap",
    },
    openTopoMap: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      name: "OpenTopoMap",
    },
  },
};

export default CONFIG;
