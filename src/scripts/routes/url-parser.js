class UrlParser {
  static parseActiveUrlWithCombiner() {
    const url = window.location.hash.slice(1).toLowerCase();
    const splitedUrl = this._urlSplitter(url);
    return this._urlCombiner(splitedUrl);
  }

  static parseActiveUrlWithoutCombiner() {
    // ✅ DON'T lowercase - keep original case for Story ID
    const url = window.location.hash.slice(1);
    return this._urlSplitter(url);
  }

  static _urlSplitter(url) {
    const urlsSplits = url.split("/");

    // ✅ Return object dengan properties yang explicit
    return {
      resource: urlsSplits[1] ? urlsSplits[1].toLowerCase() : null,
      id: urlsSplits[2] || null, // ✅ KEEP original case
      verb: urlsSplits[3] ? urlsSplits[3].toLowerCase() : null,
    };
  }

  static _urlCombiner(splitedUrl) {
    return (
      (splitedUrl.resource ? `/${splitedUrl.resource}` : "/") +
      (splitedUrl.id ? "/:id" : "") +
      (splitedUrl.verb ? `/${splitedUrl.verb}` : "")
    );
  }
}

export default UrlParser;
