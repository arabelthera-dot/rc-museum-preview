/* rc-paths.js — адрес музея, собранный из идентификатора, для браузера.
 * Близнец platform/scripts/lib/rc-paths.mjs (Node) и ~/workspace/tools/rc_paths.py (сторожа).
 * ARCHITECTURE.md, правило 3: «Идентификатор музея ≠ путь к музею» — переезд правится здесь,
 * а не в ссылках страниц. Семантика трёх реализаций сверяется сторожем check-catalog.py.
 *
 *   <script src="assets/rc-paths.js"></script>
 *   RCPaths.museumUrl('izobreteniya')            → muzei/izobreteniya/index.html
 *   RCPaths.museumUrl('izobreteniya', 2)         → ../../muzei/izobreteniya/index.html
 */
(function (root) {
  var MUSEUMS_DIR = 'muzei';
  var DEPTH = { portal: 0, museumIndex: 2, museumPage: 2 };
  var SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  function assertSlug(slug) {
    if (!SLUG.test(slug || '')) throw new Error('Недопустимый slug музея: ' + JSON.stringify(slug));
    return slug;
  }

  function upTo(depth) { return depth > 0 ? new Array(depth + 1).join('../') : ''; }

  function museumDir(slug) { return MUSEUMS_DIR + '/' + assertSlug(slug); }

  function museumUrl(slug, from) { return upTo(from || 0) + museumDir(slug) + '/index.html'; }

  function museumPageUrl(slug, page, from) {
    var file = /\.html$/.test(page) ? page : page + '.html';
    return upTo(from || 0) + museumDir(slug) + '/' + file;
  }

  function assetUrl(file, from) { return upTo(from || 0) + 'assets/' + file; }

  root.RCPaths = {
    MUSEUMS_DIR: MUSEUMS_DIR, DEPTH: DEPTH, upTo: upTo, assertSlug: assertSlug,
    museumDir: museumDir, museumUrl: museumUrl, museumPageUrl: museumPageUrl, assetUrl: assetUrl,
    museumId: function (slug) { return 'rc:museum:' + assertSlug(slug); },
    dayId: function (slug, day) { return 'rc:day:' + assertSlug(slug) + ':' + day; }
  };
})(window);
