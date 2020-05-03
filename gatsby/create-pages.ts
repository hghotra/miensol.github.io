import { CreatePagesArgs } from "gatsby";
import { Query } from "../src/types/graphql";

const path = require("path");
import createCategoriesPages from "./pagination/create-categories-pages";
import createTagsPages from "./pagination/create-tags-pages";
import createPostsPages from "./pagination/create-posts-pages";

export const createPages = async ({ graphql, actions }: CreatePagesArgs) => {
  // 404
  const baseContext = {};

  const { createPage, createRedirect } = actions;
  createPage({
    path: "/404",
    component: path.resolve("./src/templates/not-found-template.tsx"),
    context: baseContext
  });

  // Tags list
  createPage({
    path: "/tags",
    component: path.resolve("./src/templates/tags-list-template.tsx"),
    context: baseContext
  });

  // Categories list
  createPage({
    path: "/categories",
    component: path.resolve("./src/templates/categories-list-template.tsx"),
    context: baseContext
  });

  // Posts and pages from markdown
  const result = await graphql<Pick<Query, "allMarkdownRemark">>(`
    {
      allMarkdownRemark(filter: { frontmatter: { draft: { ne: true } } }) {
        edges {
          node {
            frontmatter {
              template
            }
            fields {
              slug
              redirectFrom
            }
          }
        }
      }
    }
  `);

  const { edges } = result.data!.allMarkdownRemark;

  edges.forEach(edge => {
    if (edge?.node?.frontmatter?.template === "page") {
      createPage({
        path: edge.node.fields!.slug!,
        component: path.resolve("./src/templates/page-template.tsx"),
        context: { slug: edge.node.fields!.slug! }
      });
    } else if (edge?.node?.frontmatter?.template === "post") {
      createPage({
        path: edge.node.fields!.slug!,
        component: path.resolve("./src/templates/post-template.tsx"),
        context: { slug: edge.node.fields!.slug! }
      });
    }

    const redirectFrom = edge.node.fields!.redirectFrom;
    if (redirectFrom) {
      redirectFrom.forEach(from => {
        createRedirect({
          fromPath: from!,
          isPermanent: true,
          toPath: edge.node.fields!.slug!,
          redirectInBrowser: true
        });
      });
    }
  });

  // Feeds
  await createTagsPages({ graphql, actions });
  await createCategoriesPages({ graphql, actions });
  await createPostsPages({ graphql, actions });
};
