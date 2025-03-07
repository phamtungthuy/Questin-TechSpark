import { Box, Typography, Container, Button } from "@mui/material";
import { motion } from "framer-motion";
import AdminTopBar from "components/admin/admin-topbar";
import { useNavigate } from "react-router-dom";

const AdminHomePage = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      bgcolor="#f4f6f9"
    >
      <AdminTopBar />

      {/* Animated Page Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Container maxWidth="lg">
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            py={8}
          >
            {/* Hero Text */}
            <Typography
              variant="h3"
              fontWeight={700}
              letterSpacing={1.2}
              color="primary"
              gutterBottom
            >
              Welcome to Questin Admin Panel
            </Typography>

            <Typography variant="h6" color="textSecondary" maxWidth="600px">
              Manage your knowledge base, chat, and integrations with ease.
              Navigate through the panel to access all features and customize
              your experience.
            </Typography>

            {/* CTA Buttons */}
            <Box display="flex" gap={2} mt={4}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ px: 4, py: 1.5, fontWeight: "bold", borderRadius: 3 }}
                  onClick={() => navigate("/admin/knowledge")}
                >
                  Get Started
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  sx={{ px: 4, py: 1.5, fontWeight: "bold", borderRadius: 3 }}
                  onClick={() => console.log("Learn More")}
                >
                  Learn More
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Container>
      </motion.div>
    </Box>
  );
};

export default AdminHomePage;
