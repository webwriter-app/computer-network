import { ComputerNetwork } from "../..";

export class AnimationHelper {
    static delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }


    static blinkingThenRemoveNode(nodeCssClass: string, nodeId: string, network: ComputerNetwork) {
        let node = network._graph.$('#' + nodeId);
        AnimationHelper.delay(400).then(() => {
            node.toggleClass(nodeCssClass, false);
            AnimationHelper.delay(400).then(() => {
                node.toggleClass(nodeCssClass, true);
                AnimationHelper.delay(400).then(() => {
                    node.toggleClass(nodeCssClass, false);
                    AnimationHelper.delay(400).then(() => {
                        node.toggleClass(nodeCssClass, true);
                        AnimationHelper.delay(400).then(() => {
                            node.toggleClass(nodeCssClass, false);
                            AnimationHelper.delay(400).then(() => {
                                node.toggleClass(nodeCssClass, true);
                                AnimationHelper.delay(400).then(() => node.remove());
                            });
                        });
                    });
                });
            });
        });
    }
}