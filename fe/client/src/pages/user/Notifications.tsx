import { useState } from 'react';
import { Bell, CheckCheck, Clock, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockNotifications, type Notification } from '@/lib/data';
import { useSetRecoilState } from 'recoil';
import { unreadNotificationsAtom } from '@/lib/atoms';
import { motion } from 'framer-motion';

export default function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const setUnreadCount = useSetRecoilState(unreadNotificationsAtom);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'resolved':
        return <CheckCheck className="w-5 h-5 text-green-500" />;
      case 'reply':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="max-w-4xl mx-auto backdrop-blur-sm bg-card/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Notifications</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${
                          unreadCount > 1 ? 's' : ''
                        }`
                      : 'All caught up!'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    These notifications have also been sent to your email.
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={markAllAsRead}
                  data-testid="button-mark-all-read"
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className={`${
                    !notification.read
                      ? 'border-primary/50 bg-primary/5'
                      : ''
                  } hover-elevate`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <Badge variant="default" className="flex-shrink-0">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.createdAt.toLocaleDateString()} at{' '}
                          {notification.createdAt.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}