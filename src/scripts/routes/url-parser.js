class UrlParser {
  static parseActiveUrlWithCombiner() {
    const url = window.location.hash.slice(1).toLowerCase(); // lowercase for route matching
    const splitedUrl = this._urlSplitter(url);
    return this._urlCombiner(splitedUrl);
  }

  static parseActiveUrlWithoutCombiner() {
    const url = window.location.hash.slice(1); // ✅ DON'T lowercase - keep original case!
    return this._urlSplitter(url);
  }

  static _urlSplitter(url) {
    const urlsSplits = url.split("/");
    return {
      resource: urlsSplits[1] ? urlsSplits[1].toLowerCase() : null, // lowercase route name
      id: urlsSplits[2] || null, // ✅ KEEP original case for ID!
      verb: urlsSplits[3] ? urlsSplits[3].toLowerCase() : null, // lowercase verb
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
