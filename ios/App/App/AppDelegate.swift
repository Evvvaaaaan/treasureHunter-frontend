import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import UserNotifications

// --------------------------------------------------------------------------------------
// [추가] Capacitor 알림 이름을 명시적으로 정의 (에러 해결 핵심)
// --------------------------------------------------------------------------------------
extension Notification.Name {
    static let capacitorDidRegisterForRemoteNotifications = Notification.Name("capacitorDidRegisterForRemoteNotifications")
    static let capacitorDidFailToRegisterForRemoteNotifications = Notification.Name("capacitorDidFailToRegisterForRemoteNotifications")
    static let capacitorDidReceiveNotification = Notification.Name("capacitorDidReceiveNotification")
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // 1. Firebase 초기화
        FirebaseApp.configure()
        
        // 2. Delegate 설정
        Messaging.messaging().delegate = self
        UNUserNotificationCenter.current().delegate = self
        
        // 3. 알림 권한 요청
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(options: authOptions) { granted, error in
            if let error = error {
                print("❌ 알림 권한 요청 에러: \(error)")
            }
        }
        
        application.registerForRemoteNotifications()

        DispatchQueue.main.async {
            if let bridgeVC = self.window?.rootViewController as? CAPBridgeViewController {
                bridgeVC.webView?.allowsBackForwardNavigationGestures = true
            }
        }
        
        return true
    }

    // --------------------------------------------------------------------------------------
    // [원격 알림 등록] APNs 토큰 처리
    // --------------------------------------------------------------------------------------
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    // --------------------------------------------------------------------------------------
    // [공통] Capacitor 프록시 연결 (구글 로그인 및 딥링크)
    // --------------------------------------------------------------------------------------
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}

// --------------------------------------------------------------------------------------
// [Firebase Messaging] FCM 토큰 수신
// --------------------------------------------------------------------------------------
extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("🔥 FCM 토큰: \(String(describing: fcmToken))")
        let dataDict: [String: String?] = ["token": fcmToken]
        NotificationCenter.default.post(name: Notification.Name("FCMToken"), object: nil, userInfo: dataDict as [AnyHashable : Any])
    }
}

// --------------------------------------------------------------------------------------
// [알림 수신 관리] 포그라운드 수신 및 클릭 이벤트 처리
// --------------------------------------------------------------------------------------
extension AppDelegate: UNUserNotificationCenterDelegate {
    
    // 앱이 포그라운드일 때 알림이 올 경우
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        
        completionHandler([[.banner, .list, .sound, .badge]])
    }

    // 사용자가 알림을 클릭했을 때 (에러가 났던 부분 수정 완료)
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        
        // Capacitor 플러그인에 클릭 이벤트 전달 (직접 포스트 방식 사용)
        NotificationCenter.default.post(name: .capacitorDidReceiveNotification, object: response.notification)
        
        print("👆 사용자가 알림 클릭함: \(response.notification.request.content.userInfo)")
        completionHandler()
    }
}
