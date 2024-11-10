import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Stack,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  BarChart as BarChartIcon,
  Book as BookIcon,
  Code as CodeIcon,
  LogoutOutlined as LogoutIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/quiz/history', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        setQuizHistory(data);
      } catch (error) {
        console.error('Error fetching quiz history:', error);
      }
    };

    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchHistory();
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <>
      <IconButton
        size="small"
        sx={{ 
          position: 'fixed', 
          top: 16, 
          left: 16,
          bgcolor: 'background.paper',
          boxShadow: 1,
          '&:hover': {
            bgcolor: 'background.paper',
          }
        }}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            bgcolor: 'background.default',
            borderRight: 'none'
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ mr: 1 }}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Quiz Master
            </Typography>
          </Box>

          <Divider />

          {/* User Profile */}
          {user && (
            <Box sx={{ px: 2, py: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'grey.300', color: 'grey.600' }}>
                  {user.name?.charAt(0) || 'U'}
                </Avatar>
                <Typography variant="body1">
                  {user.name || 'User'}
                </Typography>
              </Stack>
            </Box>
          )}

          <Divider />

          {/* Navigation */}
          <List sx={{ px: 2, py: 1 }}>
            <ListItemButton 
              onClick={() => navigate('/statistics')}
              sx={{ 
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <BarChartIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Statistics" 
                primaryTypographyProps={{
                  variant: 'body1',
                  fontWeight: 500
                }}
              />
            </ListItemButton>
          </List>

          {/* Recent Quizzes */}
          <Box sx={{ px: 2, py: 1, flex: 1, overflowY: 'auto' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <BookIcon sx={{ fontSize: 20 }} />
              <Typography variant="body1" fontWeight={500}>
                Recent Quizzes
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              {quizHistory.map((quiz, index) => (
                <Card 
                  key={index} 
                  variant="outlined" 
                  sx={{ 
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="body1" fontWeight={500}>
                        {quiz.topic}
                      </Typography>
                      <Chip
                        label={quiz.difficulty.toLowerCase()}
                        size="small"
                        sx={{ 
                          bgcolor: quiz.difficulty.toLowerCase() === 'easy' ? '#4caf50' : 'grey.500',
                          color: 'white',
                          fontSize: '0.75rem',
                          height: 24
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Score: {quiz.score}/{quiz.total_questions}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>

          {/* Logout Button */}
          <Box sx={{ p: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 1,
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.lighter',
                }
              }}
            >
              <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="LOGOUT" 
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 500,
                  color: 'error.main'
                }}
              />
            </ListItemButton>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}