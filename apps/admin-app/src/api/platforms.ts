import type {
  CreatePlatformRequest,
  PlatformListResponse,
  PlatformResponse,
} from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const platformsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlatforms: builder.query<PlatformResponse[], void>({
      query: () => "/platforms",
      transformResponse: (response: PlatformListResponse) => response.platforms,
      providesTags: ["Platforms"],
    }),
    createPlatform: builder.mutation<PlatformResponse, CreatePlatformRequest>({
      query: (body) => ({ url: "/platforms", method: "POST", body }),
      invalidatesTags: ["Platforms"],
    }),
    restrictPlatform: builder.mutation<PlatformResponse, string>({
      query: (id) => ({
        url: `/platforms/${id}/restrict`,
        method: "PATCH",
      }),
      invalidatesTags: ["Platforms"],
    }),
    deletePlatform: builder.mutation<void, string>({
      query: (id) => ({ url: `/platforms/${id}`, method: "DELETE" }),
      invalidatesTags: ["Platforms"],
    }),
  }),
});

export const {
  useGetPlatformsQuery,
  useCreatePlatformMutation,
  useRestrictPlatformMutation,
  useDeletePlatformMutation,
} = platformsApi;
