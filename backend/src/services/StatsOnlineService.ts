import { Player } from '../models/Player';

export class StatsOnlineService {
  /**
   * Get count of online players (activity in last 24 hours)
   */
  static async getOnlineStats() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Total online players count
    const totalOnline = await Player.countDocuments({
      lastActivityTime: {
        $gte: twentyFourHoursAgo
      }
    });

    // Online players by city
    const onlineByCity = await Player.aggregate([
      {
        $match: {
          lastActivityTime: {
            $gte: twentyFourHoursAgo
          }
        }
      },
      {
        $group: {
          _id: '$cityId',
          count: { $sum: 1 }
        }
      }
    ]);

    const cityStats: Record<string, number> = {};
    onlineByCity.forEach((stat: any) => {
      cityStats[stat._id] = stat.count;
    });

    return {
      totalOnline,
      cityStats
    };
  }

  /**
   * Get server uptime (time since last restart)
   */
  static getUptime(): number {
    return Math.floor(process.uptime());
  }

  /**
   * Get full app statistics for settings
   */
  static async getAppStats(playerCityId?: string) {
    const { totalOnline, cityStats } = await this.getOnlineStats();
    const uptime = this.getUptime();

    return {
      uptime,
      lastRestart: new Date(Date.now() - uptime * 1000).toISOString(),
      onlinePlayersTotal: totalOnline,
      onlinePlayersCity: playerCityId ? (cityStats[playerCityId] || 0) : 0,
      cityName: playerCityId || 'unknown',
      version: '1.2.1'
    };
  }
}
