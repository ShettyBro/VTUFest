import Layout from "../components/layout/layout";

export default function ChangePassword() {
  return (
    <Layout>
      <div style={{ maxWidth: "400px" }}>
        <h3>Change Password</h3>

        <input type="password" placeholder="Current Password" />
        <br /><br />

        <input type="password" placeholder="New Password" />
        <br /><br />

        <input type="password" placeholder="Confirm New Password" />
        <br /><br />

        <button>Update Password</button>
      </div>
    </Layout>
  );
}
