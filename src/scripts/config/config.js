const CONFIG = {
  BASE_URL: "https://story-api.dicoding.dev/v1",

  TILE_LAYERS: {
    openStreetMap: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    openTopoMap: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    },
  },

  MAP_CONFIG: {
    DEFAULT_LAT: -6.2,
    DEFAULT_LNG: 106.816666,
    DEFAULT_ZOOM: 5,
    MAX_ZOOM: 18,
    MIN_ZOOM: 3,
  },

  PUSH_NOTIFICATION: {
    PUBLIC_VAPID_KEY:
      "BN7-r0Svv7CsTi18-OPYtJLVW0bfuZ1x1UtrygczKjennA_kkUNVZaO9Zqx_D6JizhR3bofYL8N8qg7fq-P_VqY",
  },
};

export default CONFIG;
