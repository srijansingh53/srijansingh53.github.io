'use strict';
(self.webpackChunkv4 = self.webpackChunkv4 || []).push([
  [231],
  {
    3229: function (e, t, a) {
      a.r(t);
      var r = a(6540),
        l = a(8154),
        n = a(7581),
        i = a(8344),
        d = a(7383),
        m = a(7786),
        o = a(3270);
      const c = n.default.div.withConfig({
        displayName: 'archive__StyledTableContainer',
        componentId: 'sc-2cxdc9-0',
      })(
        [
          'margin:100px -20px;@media (max-width:768px){margin:50px -10px;}table{width:100%;border-collapse:collapse;.hide-on-mobile{@media (max-width:768px){display:none;}}tbody tr{&:hover,&:focus{background-color:var(--light-navy);}}th,td{padding:10px;text-align:left;&:first-child{padding-left:20px;@media (max-width:768px){padding-left:10px;}}&:last-child{padding-right:20px;@media (max-width:768px){padding-right:10px;}}svg{width:20px;height:20px;}}tr{cursor:default;td:first-child{border-top-left-radius:var(--border-radius);border-bottom-left-radius:var(--border-radius);}td:last-child{border-top-right-radius:var(--border-radius);border-bottom-right-radius:var(--border-radius);}}td{&.year{padding-right:20px;@media (max-width:768px){padding-right:10px;font-size:var(--fz-sm);}}&.title{padding-top:15px;padding-right:20px;color:var(--lightest-slate);font-size:var(--fz-xl);font-weight:600;line-height:1.25;}&.company{font-size:var(--fz-lg);white-space:nowrap;}&.tech{font-size:var(--fz-xxs);font-family:var(--font-mono);line-height:1.5;.separator{margin:0 5px;}span{display:inline-block;}}&.links{min-width:100px;div{display:flex;align-items:center;a{',
          ';flex-shrink:0;}a + a{margin-left:10px;}}}}}',
        ],
        e => {
          let { theme: t } = e;
          return t.mixins.flexCenter;
        },
      );
      t.default = e => {
        let { location: t, data: a } = e;
        const n = a.allMarkdownRemark.edges,
          s = (0, r.useRef)(null),
          h = (0, r.useRef)(null),
          p = (0, r.useRef)([]);
        return (
          (0, r.useEffect)(() => {
            (d.A.reveal(s.current, (0, i.srConfig)()),
              d.A.reveal(h.current, (0, i.srConfig)(200, 0)),
              p.current.forEach((e, t) => d.A.reveal(e, (0, i.srConfig)(10 * t))));
          }, []),
          r.createElement(
            m.PE,
            { location: t },
            r.createElement(l.m, { title: 'Archive' }),
            r.createElement(
              'main',
              null,
              r.createElement(
                'header',
                { ref: s },
                r.createElement('h1', { className: 'big-heading' }, 'Archive'),
                r.createElement(
                  'p',
                  { className: 'subtitle' },
                  'A big list of things I’ve worked on',
                ),
              ),
              r.createElement(
                c,
                { ref: h },
                r.createElement(
                  'table',
                  null,
                  r.createElement(
                    'thead',
                    null,
                    r.createElement(
                      'tr',
                      null,
                      r.createElement('th', null, 'Year'),
                      r.createElement('th', null, 'Title'),
                      r.createElement('th', { className: 'hide-on-mobile' }, 'Made at'),
                      r.createElement('th', { className: 'hide-on-mobile' }, 'Built with'),
                      r.createElement('th', null, 'Link'),
                    ),
                  ),
                  r.createElement(
                    'tbody',
                    null,
                    n.length > 0 &&
                      n.map((e, t) => {
                        let { node: a } = e;
                        const {
                          date: l,
                          github: n,
                          external: i,
                          ios: d,
                          android: m,
                          title: c,
                          tech: s,
                          company: h,
                        } = a.frontmatter;
                        return r.createElement(
                          'tr',
                          { key: t, ref: e => (p.current[t] = e) },
                          r.createElement(
                            'td',
                            { className: 'overline year' },
                            '' + new Date(l).getFullYear(),
                          ),
                          r.createElement('td', { className: 'title' }, c),
                          r.createElement(
                            'td',
                            { className: 'company hide-on-mobile' },
                            h
                              ? r.createElement('span', null, h)
                              : r.createElement('span', null, '—'),
                          ),
                          r.createElement(
                            'td',
                            { className: 'tech hide-on-mobile' },
                            s &&
                              s.length > 0 &&
                              s.map((e, t) =>
                                r.createElement(
                                  'span',
                                  { key: t },
                                  e,
                                  '',
                                  t !== s.length - 1 &&
                                    r.createElement('span', { className: 'separator' }, '·'),
                                ),
                              ),
                          ),
                          r.createElement(
                            'td',
                            { className: 'links' },
                            r.createElement(
                              'div',
                              null,
                              i &&
                                r.createElement(
                                  'a',
                                  {
                                    href: i,
                                    'aria-label': 'External Link',
                                    target: '_blank',
                                    rel: 'noreferrer',
                                  },
                                  r.createElement(o.In, { name: 'External' }),
                                ),
                              n &&
                                r.createElement(
                                  'a',
                                  {
                                    href: n,
                                    'aria-label': 'GitHub Link',
                                    target: '_blank',
                                    rel: 'noreferrer',
                                  },
                                  r.createElement(o.In, { name: 'GitHub' }),
                                ),
                              d &&
                                r.createElement(
                                  'a',
                                  { href: d, 'aria-label': 'Apple App Store Link' },
                                  r.createElement(o.In, { name: 'AppStore' }),
                                ),
                              m &&
                                r.createElement(
                                  'a',
                                  { href: m, 'aria-label': 'Google Play Store Link' },
                                  r.createElement(o.In, { name: 'PlayStore' }),
                                ),
                            ),
                          ),
                        );
                      }),
                  ),
                ),
              ),
            ),
          )
        );
      };
    },
  },
]);
//# sourceMappingURL=component---src-pages-archive-js-dd8386019a9bccc88616.js.map
