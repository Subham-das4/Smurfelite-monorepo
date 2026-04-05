import type { Metadata } from "next";
import { OrdersContent } from "@/components/pages/orders/OrdersContent";
import type { Order } from "@/components/pages/orders/types";

export const metadata: Metadata = {
  title: "Order History — SmurfElite",
  description:
    "View and manage your past game account purchases on SmurfElite.",
};

// In production this would be: fetch(`${process.env.API_URL}/orders`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } })
async function fetchOrders(): Promise<Order[]> {
  return [
    {
      id: "ORD-4920",
      gameAccount: {
        name: "Lvl 50 Valorant Account",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCGA8v10Dvg_U5hU_MYhH7yr7_Wj8-wwYWhQazFQqiU4vlKPkwhv4MwJ1nnH67Wi9l05H5PXbC5cCK5FQxlgLnr-vgQ86USnR4RAtGsI-UqbjrBsSkR4Pq9hPJ1dhLm-77Wm8R8pOwUpq2PWwRN4LuARxsbkypPbE-gPAQpibtkpbGFytpKIfCkGFDAKYNZXIf5upYD41dD4trqJmqpu1ZVyQm1CTUL3GahVNLxeoxWHrl90IAbaVuTtg2JC9K8tupP3hPqIndWW0o",
      },
      datePlaced: "2023-10-24T00:00:00.000Z",
      total: 45.0,
      status: "completed",
    },
    {
      id: "ORD-4918",
      gameAccount: {
        name: "Overwatch 2 - Diamond Rank",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDxTzehtRkbe81ImLZx3jSSfuhOHqQEtum6BJBpduabNlveTcmUTtHLegWyeVJltp4fNFgT2eL6EEQ_yXiX0jfzAwKlP0Ky2cvvapUaT2j_y2eKSdDHC5yVWq0Ow-_k3ml2IehZy8QHBN27GcE0Cxofxz_6S05rYzufE-5psEMXZKUKMdX9PEu7x6NkOV_uyk7I7TowExi0lTObaFIg_8ss4qkYX--TNVpHpuXh0ujKVFIa1uiDHqsUKlRXCIaAkTwUXF_4ybLfwYk",
      },
      datePlaced: "2023-10-20T00:00:00.000Z",
      total: 30.0,
      status: "completed",
    },
    {
      id: "ORD-4899",
      gameAccount: {
        name: "League of Legends - Unranked",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBTMZNqiJV1GxgQwg7Xr4rcgiWtGZC7elZDn4o8IKYAxFH1K4HkSEV6OpNAYCNnW3TuH0ezJS9URimnE1-U1ij9rjfko2-En32m4dRFtLqPvNCPPlaCcef6XIX4XRbtTGKSz-K2o1nNKv5qfahEUF9lwGxeaPB6Wzx7iTSkhA4Fqu61dbbS0QJ3i3T-T8x_F61JzM_aVtQHwI68OCsna8HDWXLID-e38-BccfDMd7s95n5ki3vdWXpBXAitvKKOCm3W9wHZv9OpnDI",
      },
      datePlaced: "2023-10-15T00:00:00.000Z",
      total: 15.0,
      status: "processing",
    },
    {
      id: "ORD-4850",
      gameAccount: {
        name: "Apex Legends - Heirloom Set",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDUz5ONIW-Ku_IQdVC0usFBJ8ZVkXBfuIE8YE62jEBweFI7yLYXv5sUYASK5dQSYaMyo3BLLTxgUcLG2WcKWgt7iq1_ovaXgUqWAnmYAoVs3GQT3OjChli_-0XiV0DFCfl7Usqt0kygsH7ZRR0ryMqrMz7JRsOFDnOUlnEiUJss3Zjqb3YRdkXeXulsg2gqXJmxYx7pykHnYZrraYnV9SOLCPj3kx0EznQkqST6UbN05uOhOqLduaYwtujrXFiRxRStOwuxZC0MLX4",
      },
      datePlaced: "2023-09-30T00:00:00.000Z",
      total: 120.0,
      status: "cancelled",
    },
    {
      id: "ORD-4812",
      gameAccount: {
        name: "Fortnite - Rare Skins",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCrR5vXqiCSVY3_KaKzD9x-RZgBKMolAoHv647SdlA4vximYrMGSeEzthrAjqBvNq8NS8h-9Abm9fSpmmOH53bkFcagiWE0VSzJI9RtBNX1-Amzoif2i2uNpnP0rAkHlTnBUyNOjC_2xRBhU91oD6zub6HAAUxejIhBLtvxap1Gcl-b86n595MoZq3lr7DMlYSq2Y200u6px09KaDJDIwjfyt7FdrzVJtL-hg4hvbMXul5UXHBGQUghFuvl6GLpz4Ei-1kPLtiNVfo",
      },
      datePlaced: "2023-09-25T00:00:00.000Z",
      total: 60.0,
      status: "completed",
    },
    {
      id: "ORD-4791",
      gameAccount: {
        name: "CS2 - Global Elite",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCGA8v10Dvg_U5hU_MYhH7yr7_Wj8-wwYWhQazFQqiU4vlKPkwhv4MwJ1nnH67Wi9l05H5PXbC5cCK5FQxlgLnr-vgQ86USnR4RAtGsI-UqbjrBsSkR4Pq9hPJ1dhLm-77Wm8R8pOwUpq2PWwRN4LuARxsbkypPbE-gPAQpibtkpbGFytpKIfCkGFDAKYNZXIf5upYD41dD4trqJmqpu1ZVyQm1CTUL3GahVNLxeoxWHrl90IAbaVuTtg2JC9K8tupP3hPqIndWW0o",
      },
      datePlaced: "2023-09-10T00:00:00.000Z",
      total: 85.0,
      status: "completed",
    },
    {
      id: "ORD-4760",
      gameAccount: {
        name: "Valorant - Immortal Smurf",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCGA8v10Dvg_U5hU_MYhH7yr7_Wj8-wwYWhQazFQqiU4vlKPkwhv4MwJ1nnH67Wi9l05H5PXbC5cCK5FQxlgLnr-vgQ86USnR4RAtGsI-UqbjrBsSkR4Pq9hPJ1dhLm-77Wm8R8pOwUpq2PWwRN4LuARxsbkypPbE-gPAQpibtkpbGFytpKIfCkGFDAKYNZXIf5upYD41dD4trqJmqpu1ZVyQm1CTUL3GahVNLxeoxWHrl90IAbaVuTtg2JC9K8tupP3hPqIndWW0o",
      },
      datePlaced: "2023-09-01T00:00:00.000Z",
      total: 55.0,
      status: "cancelled",
    },
    {
      id: "ORD-4730",
      gameAccount: {
        name: "Apex Legends - Predator",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDUz5ONIW-Ku_IQdVC0usFBJ8ZVkXBfuIE8YE62jEBweFI7yLYXv5sUYASK5dQSYaMyo3BLLTxgUcLG2WcKWgt7iq1_ovaXgUqWAnmYAoVs3GQT3OjChli_-0XiV0DFCfl7Usqt0kygsH7ZRR0ryMqrMz7JRsOFDnOUlnEiUJss3Zjqb3YRdkXeXulsg2gqXJmxYx7pykHnYZrraYnV9SOLCPj3kx0EznQkqST6UbN05uOhOqLduaYwtujrXFiRxRStOwuxZC0MLX4",
      },
      datePlaced: "2023-08-20T00:00:00.000Z",
      total: 200.0,
      status: "completed",
    },
    {
      id: "ORD-4700",
      gameAccount: {
        name: "League of Legends - Diamond",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBTMZNqiJV1GxgQwg7Xr4rcgiWtGZC7elZDn4o8IKYAxFH1K4HkSEV6OpNAYCNnW3TuH0ezJS9URimnE1-U1ij9rjfko2-En32m4dRFtLqPvNCPPlaCcef6XIX4XRbtTGKSz-K2o1nNKv5qfahEUF9lwGxeaPB6Wzx7iTSkhA4Fqu61dbbS0QJ3i3T-T8x_F61JzM_aVtQHwI68OCsna8HDWXLID-e38-BccfDMd7s95n5ki3vdWXpBXAitvKKOCm3W9wHZv9OpnDI",
      },
      datePlaced: "2023-08-10T00:00:00.000Z",
      total: 70.0,
      status: "processing",
    },
    {
      id: "ORD-4680",
      gameAccount: {
        name: "Overwatch 2 - Master",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDxTzehtRkbe81ImLZx3jSSfuhOHqQEtum6BJBpduabNlveTcmUTtHLegWyeVJltp4fNFgT2eL6EEQ_yXiX0jfzAwKlP0Ky2cvvapUaT2j_y2eKSdDHC5yVWq0Ow-_k3ml2IehZy8QHBN27GcE0Cxofxz_6S05rYzufE-5psEMXZKUKMdX9PEu7x6NkOV_uyk7I7TowExi0lTObaFIg_8ss4qkYX--TNVpHpuXh0ujKVFIa1uiDHqsUKlRXCIaAkTwUXF_4ybLfwYk",
      },
      datePlaced: "2023-07-28T00:00:00.000Z",
      total: 40.0,
      status: "completed",
    },
    {
      id: "ORD-4650",
      gameAccount: {
        name: "Fortnite - Battle Pass",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCrR5vXqiCSVY3_KaKzD9x-RZgBKMolAoHv647SdlA4vximYrMGSeEzthrAjqBvNq8NS8h-9Abm9fSpmmOH53bkFcagiWE0VSzJI9RtBNX1-Amzoif2i2uNpnP0rAkHlTnBUyNOjC_2xRBhU91oD6zub6HAAUxejIhBLtvxap1Gcl-b86n595MoZq3lr7DMlYSq2Y200u6px09KaDJDIwjfyt7FdrzVJtL-hg4hvbMXul5UXHBGQUghFuvl6GLpz4Ei-1kPLtiNVfo",
      },
      datePlaced: "2023-07-15T00:00:00.000Z",
      total: 25.0,
      status: "completed",
    },
    {
      id: "ORD-4620",
      gameAccount: {
        name: "CS2 - Silver Smurf",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCGA8v10Dvg_U5hU_MYhH7yr7_Wj8-wwYWhQazFQqiU4vlKPkwhv4MwJ1nnH67Wi9l05H5PXbC5cCK5FQxlgLnr-vgQ86USnR4RAtGsI-UqbjrBsSkR4Pq9hPJ1dhLm-77Wm8R8pOwUpq2PWwRN4LuARxsbkypPbE-gPAQpibtkpbGFytpKIfCkGFDAKYNZXIf5upYD41dD4trqJmqpu1ZVyQm1CTUL3GahVNLxeoxWHrl90IAbaVuTtg2JC9K8tupP3hPqIndWW0o",
      },
      datePlaced: "2023-07-05T00:00:00.000Z",
      total: 18.0,
      status: "cancelled",
    },
  ];
}

export default async function OrdersPage() {
  const orders = await fetchOrders();
  return <OrdersContent initialOrders={orders} />;
}
