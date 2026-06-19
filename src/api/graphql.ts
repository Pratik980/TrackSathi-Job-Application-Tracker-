import { buildSchema, graphql, type GraphQLSchema } from "graphql";
import * as applicationsApi from "./applications";
import type { Application, ApplicationInput, ListParams, ListResult, Status, JobType } from "@/lib/applications";

const schema: GraphQLSchema = buildSchema(`
  type Application {
    id: ID!
    company_name: String!
    job_title: String!
    job_type: String!
    status: String!
    applied_date: String!
    notes: String
    created_at: String!
    updated_at: String!
  }

  type ListResult {
    rows: [Application!]!
    total: Int!
    page: Int!
    limit: Int!
  }

  input ApplicationInput {
    company_name: String!
    job_title: String!
    job_type: String!
    status: String!
    applied_date: String!
    notes: String
  }

  input ApplicationUpdateInput {
    company_name: String
    job_title: String
    job_type: String
    status: String
    applied_date: String
    notes: String
  }

  type DeleteResult {
    success: Boolean!
  }

  type Query {
    applications(page: Int, limit: Int, search: String, status: String, jobType: String): ListResult!
    application(id: ID!): Application!
  }

  type Mutation {
    createApplication(input: ApplicationInput!): Application!
    updateApplication(id: ID!, input: ApplicationUpdateInput!): Application!
    deleteApplication(id: ID!): DeleteResult!
  }
`);

const rootValue = {
  applications: async (args: Partial<ListParams>) => {
    const params: ListParams = {
      page: args.page ?? 1,
      limit: args.limit ?? 20,
      search: args.search,
      status: args.status as Status | "all",
      jobType: args.jobType as JobType | "all",
    };
    return applicationsApi.list(new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ));
  },
  application: async ({ id }: { id: string }) => applicationsApi.getById(id),
  createApplication: async ({ input }: { input: ApplicationInput }) => applicationsApi.create(input),
  updateApplication: async ({ id, input }: { id: string; input: Partial<ApplicationInput> }) => applicationsApi.update(id, input),
  deleteApplication: async ({ id }: { id: string }) => {
    await applicationsApi.remove(id);
    return { success: true };
  },
};

export async function handleGraphQL(body: string): Promise<{ data?: unknown; errors?: unknown }> {
  const { query, variables } = JSON.parse(body);
  return graphql({ schema, source: query, rootValue, variableValues: variables }) as Promise<{
    data?: unknown;
    errors?: unknown;
  }>;
}
