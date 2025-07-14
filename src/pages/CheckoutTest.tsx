import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";

const CheckoutTest = () => {
  const { id } = useParams();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1>Checkout Test Page</h1>
        <p>Book ID: {id}</p>
        <p>This is a simple test to see if the routing works.</p>
      </div>
    </Layout>
  );
};

export default CheckoutTest;
