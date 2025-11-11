import CONFIG from "../config/config.js";

class StoryApi {
  static async register({ name, email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message || "Failed to register");
    }

    return responseJson;
  }

  static async login({ email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message || "Failed to login");
    }

    return responseJson;
  }

  static async getStories(token, page = 1, size = 20, location = 1) {
    const response = await fetch(
      `${CONFIG.BASE_URL}/stories?page=${page}&size=${size}&location=${location}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message || "Failed to fetch stories");
    }

    return responseJson;
  }

  static async getStoryDetail(token, id) {
    const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message || "Failed to fetch story detail");
    }

    return responseJson;
  }

  static async addStory(token, { description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append("description", description);
    formData.append("photo", photo);
    if (lat) formData.append("lat", lat);
    if (lon) formData.append("lon", lon);

    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message || "Failed to add story");
    }

    return responseJson;
  }
}

export default StoryApi;
