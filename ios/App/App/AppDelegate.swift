import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging // [추가] 1. Messaging 모듈 추가
import UserNotifications // [추가] 2. 알림 프레임워크 추가

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate, UNUserNotificationCenterDelegate {
    // [추가] 3. 프로토콜(Delegate) 채택 (MessagingDelegate, UNUserNotificationCenterDelegate)

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // 1. Firebase 설정 초기화
        FirebaseApp.configure()
        
        // [추가] 2. Firebase Messaging Delegate 연결
        Messaging.messaging().delegate = self
        
        // [추가] 3. 알림 권한 요청 및 등록 (iOS 시스템)
        UNUserNotificationCenter.current().delegate = self
        
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(
            options: authOptions,
            completionHandler: { _, _ in }
        )
        
        application.registerForRemoteNotifications()
        
        return true
    }

    // --------------------------------------------------------------------------------------
    // [추가] 핵심 기능: 애플(APNs)에서 받은 기기 토큰을 Firebase와 Capacitor에 전달
    // --------------------------------------------------------------------------------------
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // 1. Firebase에 APNs 토큰 매핑 (이 코드가 없으면 알림이 오지 않습니다)
        Messaging.messaging().apnsToken = deviceToken
        
        // 2. Capacitor에 토큰 전달 (Capacitor 플러그인이 JS로 이벤트를 보내기 위해 필요)
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    // [추가] 알림 등록 실패 시 처리
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        // Capacitor에 실패 사실 전달
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
        print("❌ Failed to register for remote notifications: \(error.localizedDescription)")
    }

    // --------------------------------------------------------------------------------------
    // 기존 Capacitor 필수 코드 (유지)
    // --------------------------------------------------------------------------------------

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}

// --------------------------------------------------------------------------------------
// [추가] FCM 토큰 모니터링 Extension
// --------------------------------------------------------------------------------------
extension AppDelegate {
    // Firebase가 FCM 등록 토큰을 갱신하거나 새로 생성했을 때 호출됨
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("🔥 Firebase registration token: \(String(describing: fcmToken))")
        
        let dataDict: [String: String] = ["token": fcmToken ?? ""]
        NotificationCenter.default.post(
            name: Notification.Name("FCMToken"),
            object: nil,
            userInfo: dataDict
        )
    }
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                    willPresent notification: UNNotification,
                                    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
            
            let userInfo = notification.request.content.userInfo
            print("🔔 Push notification received in foreground: \(userInfo)")
            
            // 배너(.banner, .list), 소리(.sound), 배지(.badge) 모두 표시
        completionHandler([.banner,.list, .sound, .badge])
        }
}
