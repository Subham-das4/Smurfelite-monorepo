import type {
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
  }),
});

export const { useGetCategoriesQuery } = categoriesApi;
