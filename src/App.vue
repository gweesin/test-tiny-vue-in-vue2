<script>
import { TimeLine } from "@opentiny/vue";

export default {
  render(h) {
    return h(TimeLine, {
      props: {
        data: [
          { name: "已下单", time: "2019-11-11 00:01:30" },
          { name: "运输中", time: "2019-11-12 14:20:15" },
          { name: "已签收", time: "2019-11-14 20:45:50" },
        ],
      },
    });
  },
};
</script>
