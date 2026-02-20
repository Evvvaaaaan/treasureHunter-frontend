# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# 1. Capacitor 기본 (이게 없으면 플러그인을 못 찾음)
-keep public class * extends com.getcapacitor.Plugin
-keep public class com.getcapacitor.PluginMethod { *; }
-keep public class com.getcapacitor.MessageHandler { *; }

# 2. 구글 로그인 플러그인 보호 (가장 중요 ⭐)
# 배포판에서 이 클래스가 삭제되면 로그인이 먹통됨
-keep class com.codetrixstudio.capacitor.GoogleAuth.** { *; }
-keep interface com.codetrixstudio.capacitor.GoogleAuth.** { *; }

# 3. Google Play Services 보호
-keep class com.google.android.gms.** { *; }
-keep class com.google.android.gms.common.** { *; }
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.tasks.** { *; }

# 4. 기타 필수 보호
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable