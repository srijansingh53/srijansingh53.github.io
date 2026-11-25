import { graphql } from 'gatsby';
import V2Page from '@v2/Page';

// Homepage (v2). Page code lives in src/v2; Gatsby needs the page query here.
export default V2Page;

export const query = graphql`
  query {
    avatar: file(sourceInstanceName: { eq: "images" }, relativePath: { eq: "me.jpeg" }) {
      childImageSharp {
        gatsbyImageData(width: 240, aspectRatio: 1, transformOptions: { cropFocus: ATTENTION }, placeholder: BLURRED, formats: [AUTO, WEBP])
      }
    }
    featured: allMarkdownRemark(
      filter: { fileAbsolutePath: { regex: "/featured/" } }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        frontmatter {
          title
          cover {
            childImageSharp {
              gatsbyImageData(width: 1200, placeholder: BLURRED, formats: [AUTO, WEBP])
            }
          }
          tech
          github
          external
        }
        html
      }
    }
    projects: allMarkdownRemark(
      filter: {
        fileAbsolutePath: { regex: "/content/projects/" }
        frontmatter: { showInProjects: { eq: true } }
      }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        frontmatter {
          title
          tech
          github
          external
          company
        }
        html
      }
    }
  }
`;
