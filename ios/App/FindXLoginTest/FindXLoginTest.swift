//
//  FindXLoginTest.swift
//  FindXLoginTest
//
//  Created by Song Junsun on 2/12/26.
//

import XCTest

final class FindXLoginTest: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.

        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false

        // In UI tests it’s important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    @MainActor
    func testExample() throws {
        

        let app = XCUIApplication()
        app.activate()
        app/*@START_MENU_TOKEN@*/.textFields["Reviewer ID"]/*[[".otherElements.textFields[\"Reviewer ID\"]",".textFields",".textFields[\"Reviewer ID\"]"],[[[-1,2],[-1,1],[-1,0]]],[0]]@END_MENU_TOKEN@*/.firstMatch.tap()
        app/*@START_MENU_TOKEN@*/.textFields["Reviewer ID"]/*[[".otherElements",".textFields[\"applereview389503920384\"]",".textFields[\"Reviewer ID\"]",".textFields"],[[[-1,2],[-1,1],[-1,3],[-1,0,1]],[[-1,2],[-1,1]]],[0]]@END_MENU_TOKEN@*/.firstMatch.typeText("applereview389503920384")
        app/*@START_MENU_TOKEN@*/.secureTextFields["Reviewer Password"]/*[[".otherElements",".secureTextFields[\"••••••\"]",".secureTextFields[\"Reviewer Password\"]",".secureTextFields"],[[[-1,2],[-1,1],[-1,3],[-1,0,1]],[[-1,2],[-1,1]]],[0]]@END_MENU_TOKEN@*/.firstMatch.typeText("TliKs9eZdRiXdPWBpX0MO84aRyxrvSzxFOJ35VB9Oxq1tpui")
        app/*@START_MENU_TOKEN@*/.buttons["리뷰어 로그인 확인"]/*[[".otherElements.buttons[\"리뷰어 로그인 확인\"]",".buttons[\"리뷰어 로그인 확인\"]"],[[[-1,1],[-1,0]]],[0]]@END_MENU_TOKEN@*/.firstMatch.tap()
        app/*@START_MENU_TOKEN@*/.buttons["Ok"]/*[[".otherElements.buttons[\"Ok\"]",".buttons",".buttons[\"Ok\"]"],[[[-1,2],[-1,1],[-1,0]]],[0]]@END_MENU_TOKEN@*/.firstMatch.tap()
                // Use XCTAssert and related functions to verify your tests produce the correct results.
        app.launch()
    }

    @MainActor
    func testLaunchPerformance() throws {
        // This measures how long it takes to launch your application.
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }
}
