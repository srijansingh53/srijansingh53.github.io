'use strict';
(self.webpackChunkv4 = self.webpackChunkv4 || []).push([
  [125],
  {
    3331: function (e, t, n) {
      n.r(t);
      var l = n(6540),
        o = n(4794),
        a = n(8154),
        i = n(4038),
        m = n(6488),
        c = n(7581),
        s = n(7110),
        u = n(7786);
      const r = c.default.main.withConfig({
          displayName: 'sc-404__StyledMainContainer',
          componentId: 'sc-bnxlhm-0',
        })(['', ';flex-direction:column;'], e => {
          let { theme: t } = e;
          return t.mixins.flexCenter;
        }),
        f = c.default.h1.withConfig({
          displayName: 'sc-404__StyledTitle',
          componentId: 'sc-bnxlhm-1',
        })([
          'color:var(--green);font-family:var(--font-mono);font-size:clamp(100px,25vw,200px);line-height:1;',
        ]),
        d = c.default.h2.withConfig({
          displayName: 'sc-404__StyledSubtitle',
          componentId: 'sc-bnxlhm-2',
        })(['font-size:clamp(30px,5vw,50px);font-weight:400;']),
        p = (0, c.default)(o.Link).withConfig({
          displayName: 'sc-404__StyledHomeButton',
          componentId: 'sc-bnxlhm-3',
        })(['', ';margin-top:40px;'], e => {
          let { theme: t } = e;
          return t.mixins.bigButton;
        });
      t.default = e => {
        let { location: t } = e;
        const { 0: n, 1: o } = (0, l.useState)(!1);
        return (
          (0, l.useEffect)(() => {
            const e = setTimeout(() => o(!0), s.LF);
            return () => clearTimeout(e);
          }, []),
          l.createElement(
            u.PE,
            { location: t },
            l.createElement(a.m, { title: 'Page Not Found' }),
            l.createElement(
              i.A,
              { component: null },
              n &&
                l.createElement(
                  m.A,
                  { timeout: 500, classNames: 'fadeup' },
                  l.createElement(
                    r,
                    { className: 'fillHeight' },
                    l.createElement(f, null, '404'),
                    l.createElement(d, null, 'Page Not Found'),
                    l.createElement(p, { to: '/' }, 'Go Home'),
                  ),
                ),
            ),
          )
        );
      };
    },
  },
]);
//# sourceMappingURL=component---src-pages-404-js-9af01da8be0d887c92a2.js.map
