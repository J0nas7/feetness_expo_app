//
//  TimeTrackingModuleHeader.m
//  feetness_expo_app
//
//  Created by Jonas Alexander Sørensen on 09/01/2026.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(TimeTracking, RCTEventEmitter)

RCT_EXTERN_METHOD(startActivity)
RCT_EXTERN_METHOD(updateActivity:(NSString *)distance timeSpend:(NSString *)timeSpend percent:(NSNumber *)percent pace:(NSNumber *)pace exercise:(NSString *)exercise goalAmount:(NSNumber *)goalAmount goalMetric:(NSString *)goalMetric)
RCT_EXTERN_METHOD(endActivity)
RCT_EXTERN_METHOD(setWorkoutPaused:(BOOL)paused)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(isWorkoutPaused)

@end
