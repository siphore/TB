import express from "express";
import { gql, GraphQLClient } from "graphql-request";
import makeAuthorizedRequest from "../../helpers/auth.js";

const router = express.Router();

const JOBBER_API = "https://api.getjobber.com/api/graphql";

const getGraphQLClient = async (accessToken) => {
  return new GraphQLClient(JOBBER_API, {
    headers: {
      "X-JOBBER-GRAPHQL-VERSION": "2025-01-20",
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

router.post("/invoice", async (req, res) => {
  const { itemId } = req.body;

  const query = gql`
    {
      invoice(id: "${itemId}") {
        id
        invoiceNumber
        dueDate
        subject
        amounts {
          total
        }
        lineItems {
          nodes {
            name
            description
            date
            quantity
            unitPrice
            totalPrice
            taxable
          }
        }
        client {
          isCompany
          companyName
          firstName
          lastName
          phones {
            number
          }
          emails {
            address
          }
        }
        billingAddress {
          country
          city
          postalCode
          street
          province
        }
        jobs {
          nodes {
            title
            jobType
          }
        }
      }
    }
  `;

  try {
    const result = await makeAuthorizedRequest(async (token) => {
      const client = await getGraphQLClient(token);
      return await client.request(query, { id: itemId });
    });

    res.json(result);
  } catch (e) {
    console.error("Error from Jobber API:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
