import type {
  CreateGameCategoryRequest,
  GameCategoryListResponse,
  GameCategoryResponse,
} from "@smurfelite/types";
import { baseApi } from "./baseApi";

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<GameCategoryResponse[], void>({
      query: () => "/game-categories",
      transformResponse: (response: GameCategoryListResponse) =>
        response.categories,
      providesTags: ["Categories"],
    }),
    createCategory: builder.mutation<
      GameCategoryResponse,
      CreateGameCategoryRequest
    >({
      query: (body) => ({ url: "/game-categories", method: "POST", body }),
      invalidatesTags: ["Categories"],
    }),
    restrictCategory: builder.mutation<GameCategoryResponse, string>({
      query: (id) => ({
        url: `/game-categories/${id}/restrict`,
        method: "PATCH",
      }),
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `/game-categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["Categories"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useRestrictCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
