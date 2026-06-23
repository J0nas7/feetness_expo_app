//
//  TimeTrackingModuleHeader.m
//  feetness_expo_app
//
//  Created by Jonas Alexander Sørensen on 09/01/2026.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TimeTracking, NSObject)

RCT_EXTERN_METHOD(startActivity)
RCT_EXTERN_METHOD(updateActivity:(NSString *)distance timeSpend:(NSString *)timeSpend percent:(NSNumber *)percent)
RCT_EXTERN_METHOD(endActivity)

@end
