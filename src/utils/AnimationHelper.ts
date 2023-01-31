import { ComputerNetwork } from "../..";

export class AnimationHelper {
    static delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }


    static blinkingThenRemoveNode(nodeCssClass: string, nodeId: string, network: ComputerNetwork){
        AnimationHelper.delay(500).then(() => {
            network._graph.$('#' + nodeId).toggleClass(nodeCssClass, true);
            AnimationHelper.delay(500).then(() => {
                network._graph.$('#' + nodeId).toggleClass(nodeCssClass, false);
                AnimationHelper.delay(500).then(() => {
                    network._graph.$('#' + nodeId).toggleClass(nodeCssClass, true);
                    AnimationHelper.delay(500).then(() => {
                        network._graph.$('#' + nodeId).toggleClass(nodeCssClass, false);
                        AnimationHelper.delay(500).then(() => {
                            network._graph.$('#' + nodeId).toggleClass(nodeCssClass, true);
                            AnimationHelper.delay(500).then(() => network._graph.$('#' + nodeId).remove());
                        });
                    });
                });
            });
        });

    }
}